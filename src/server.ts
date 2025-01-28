import { Constants, db, Logger } from '@utils';
import * as http from 'node:http';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { UserRepositoryImpl } from '@domains/user/repository';
import { MessageRepositoryImpl } from '@domains/message/repository';
import { SocketIoServer } from '@utils/socketIoServer';
import { app } from '@app';

const httpServer: http.Server<typeof IncomingMessage, typeof ServerResponse> = createServer(app)

export const socketIoServer: SocketIoServer = new SocketIoServer(
  httpServer,
  new MessageRepositoryImpl(db),
  new UserRepositoryImpl(db)
);
socketIoServer.initSocketServer();

httpServer.listen(Constants.PORT, () => {
  Logger.info(`
      ################################################
      🛡️  Server listening on port: ${Constants.PORT} ${Date()} 🛡️ 
      ################################################
    `);
})
