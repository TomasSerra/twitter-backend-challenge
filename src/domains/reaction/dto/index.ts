import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Reaction, ReactionAction } from '@prisma/client';

export class ReactionDTO {
  constructor(reaction: Reaction) {
    this.id = reaction.id;
    this.authorId = reaction.authorId;
    this.postId = reaction.postId;
    this.action = reaction.action;
    this.createdAt = reaction.createdAt;
  }

  id: string;
  authorId: string;
  postId: string;
  action: ReactionAction;
  createdAt: Date;
}

export class ReactionActionDTO {
  @IsEnum(ReactionAction)
  @IsNotEmpty()
  action!: ReactionAction;
}

export class DeleteReactionDTO {
  constructor(userId: string, postId: string, action: ReactionAction) {
    this.userId = userId;
    this.postId = postId;
    this.action = action;
  }

  @IsEnum(ReactionAction)
  @IsNotEmpty()
  action: ReactionAction;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class GetReactionDTO {
  constructor(reactionId: string) {
    this.reactionId = reactionId;
  }

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  reactionId: string;
}

export class GetReactionsFromUserDTO {
  constructor(userId: string, authorId: string) {
    this.userId = userId;
    this.authorId = authorId;
  }

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  authorId: string;
}
export class GetReactionsFromPostDTO {
  constructor(userId: string, postId: string) {
    this.userId = userId;
    this.postId = postId;
  }

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;
}

export class CreateReactionDTO {
  constructor(userId: string, postId: string, reaction: ReactionActionDTO) {
    this.userId = userId;
    this.postId = postId;
    this.action = reaction.action;
  }

  @IsEnum(ReactionAction)
  @IsNotEmpty()
  action: ReactionAction;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
