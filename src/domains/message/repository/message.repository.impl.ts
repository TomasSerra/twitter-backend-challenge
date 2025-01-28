import { MessageRepository } from '@domains/message/repository/message.repository';
import { GetChatMessagesDTO, MessageDTO } from '@domains/message/dto';
import { CursorPagination } from '@types';
import { PrismaClient } from '@prisma/client';

export class MessageRepositoryImpl implements MessageRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: MessageDTO): Promise<MessageDTO> {
    const message = await this.db.message.create({
      data: {
        ...data,
      },
    });

    return new MessageDTO(message);
  }

  async delete(messageId: string): Promise<void> {
    await this.db.message.delete({
      where: {
        id: messageId,
      },
    });
  }

  async getAllMessagesFromChatPaginated(data: GetChatMessagesDTO, options: CursorPagination): Promise<MessageDTO[]> {
    const messages = await this.db.message.findMany({
      cursor: options.after ? { id: options.after } : options.before ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        senderId: data.senderId,
        receiverId: data.receiverId,
      },
    });

    return messages.map((message) => new MessageDTO(message));
  }

  async getMessageById(messageId: string): Promise<MessageDTO | null> {
    const message = await this.db.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (message === null) return null;

    return new MessageDTO(message);
  }
}
