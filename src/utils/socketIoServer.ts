import { Server } from 'socket.io';
import { Constants, ForbiddenException, NotFoundException, UnauthorizedException } from '@utils/index';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import { MessageDTO } from '@domains/message/dto';
import { UserService, UserServiceImpl } from '@domains/user/service';
import { MessageService, MessageServiceImpl } from '@domains/message/service';
import { MessageRepository } from '@domains/message/repository';
import { UserRepository } from '@domains/user/repository';

export class SocketIoServer {
  constructor(
    httpServer: http.Server<typeof IncomingMessage, typeof ServerResponse>,
    messageRepository: MessageRepository,
    userRepository: UserRepository
  ) {
    this.httpServer = httpServer;
    this.messageService = new MessageServiceImpl(messageRepository, userRepository);
    this.userValidationService = new UserServiceImpl(userRepository);
  }

  private readonly httpServer: http.Server<typeof IncomingMessage, typeof ServerResponse>;
  private readonly messageService: MessageService;
  private readonly userValidationService: UserService;

  initSocketServer(): void {
    const io = new Server(this.httpServer, {
      cors: {
        origin: Constants.CORS_WHITELIST,
        methods: ['*'],
      },
    });

    io.use((socket, next): void => {
      const token = socket.handshake.headers.authorization;
      if (token === undefined) {
        next(new UnauthorizedException('MISSING_TOKEN'));
      } else {
        jwt.verify(token, Constants.TOKEN_SECRET, (err: VerifyErrors | null, context) => {
          if (err) next(new UnauthorizedException('INVALID_TOKEN'));
          if (context === undefined) next(new NotFoundException('MISSING MESSAGE DATA'));
          const decodedToken = context as JwtPayload;
          socket.data.userId = decodedToken.userId;
          if (socket.data.userId === null || socket.data.userId === undefined) {
            next(new NotFoundException('MISSING USER ID'));
          }
          next();
        });
      }
    });

    io.on('connection', async (socket): Promise<void> => {
      console.log(`socket ${socket.id} connected`);
      socket.broadcast.emit('user connected', {
        userId: socket.data.userId,
        sessionId: socket.id,
      });

      await socket.leave(socket.id);
      await socket.join(socket.data.userId);
      console.log(socket.rooms);

      socket.on('message', async ({ receiverId, content }): Promise<void> => {
        try {
          const senderId = socket.data.userId;

          if (await this.userValidationService.checkIfUserExists(receiverId)) {
            if (await this.userValidationService.isUserFollowed(senderId, receiverId)) {
              io.to(receiverId).to(senderId).emit('message', {
                content,
                senderId,
                receiverId,
              });

              const data = new MessageDTO({ senderId, receiverId, content });
              await this.messageService.create(data);
            } else {
              throw new ForbiddenException();
            }
          } else {
            throw new NotFoundException('user not found');
          }
        } catch (error) {
          console.error('Error handling message event:', error);
          if (error instanceof ForbiddenException || error instanceof NotFoundException) {
            socket.emit('error', { message: error.message });
          } else {
            socket.emit('error', { message: 'Internal server error' });
          }
        }
      });
    });
  }

  closeServerConnection(): void {
    this.httpServer.close();
  }
}
