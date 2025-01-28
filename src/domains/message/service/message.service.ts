import { MessageDTO } from '@domains/message/dto';
import { CursorPagination } from '@types';

export interface MessageService {
  create: (message: MessageDTO) => Promise<MessageDTO>;
  delete: (senderId: string, messageId: string) => Promise<void>;

  getMessageById: (MessageId: string) => Promise<MessageDTO>;
  getAllMessagesFromChatPaginated: (
    senderId: string,
    receiverId: string,
    options: CursorPagination
  ) => Promise<MessageDTO[]>;
}
