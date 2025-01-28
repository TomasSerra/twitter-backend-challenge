import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MessageDTO {
  constructor(message: MessageDTO) {
    this.senderId = message.senderId;
    this.receiverId = message.receiverId;
    this.content = message.content;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  receiverId: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

export class DeleteMessageDTO {
  constructor(senderId: string, messageId: string) {
    this.senderId = senderId;
    this.messageId = messageId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  messageId: string;
}

export class GetChatMessagesDTO {
  constructor(senderId: string, receiverId: string) {
    this.senderId = senderId;
    this.receiverId = receiverId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  receiverId: string;
}

export class GetMessageById {
  constructor(messageId: string) {
    this.messageId = messageId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  messageId: string;
}
