import { MessageService } from '@domains/message/service/message.service';

import { DeleteMessageDTO, GetChatMessagesDTO, GetMessageById, MessageDTO } from '@domains/message/dto';
import { CursorPagination } from '@types';
import { validate } from 'class-validator';
import { MessageRepository } from '@domains/message/repository';
import { ForbiddenException, InvalidUserException, NotFoundException, ValidationException } from '@utils';
import { UserRepository } from '@domains/user/repository';

export class MessageServiceImpl implements MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly userValidationRepository: UserRepository
  ) {}

  async create(message: MessageDTO): Promise<MessageDTO> {
    const errors = await validate(message, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    return await this.repository.create(message);
  }

  async delete(senderId: string, messageId: string): Promise<void> {
    const data = new DeleteMessageDTO(senderId, messageId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const message = await this.repository.getMessageById(data.messageId);
    if (message === null) throw new NotFoundException('message');

    if (message.senderId !== senderId) throw new ForbiddenException();

    await this.repository.delete(messageId);
  }

  async getAllMessagesFromChatPaginated(
    senderId: string,
    receiverId: string,
    options: CursorPagination
  ): Promise<MessageDTO[]> {
    const data = new GetChatMessagesDTO(senderId, receiverId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const result = await this.userValidationRepository.isUserFollowed(data.senderId, data.receiverId);

    if (!result) throw new InvalidUserException();

    const messages = await this.repository.getAllMessagesFromChatPaginated(data, options);
    if (!messages.length) throw new NotFoundException('messages');

    return messages;
  }

  async getMessageById(messageId: string): Promise<MessageDTO> {
    const data = new GetMessageById(messageId);

    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const message = await this.repository.getMessageById(data.messageId);
    if (message === null) throw new NotFoundException('message');

    return message;
  }
}
