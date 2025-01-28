import { PostDTO } from '@domains/post/dto';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CommentDTO extends PostDTO {
  constructor(comment: CommentDTO) {
    super(comment);
    this.parentPostId = comment.parentPostId;
  }

  parentPostId: string | null;
}

export class DeleteCommentDTO {
  constructor(userId: string, postId: string) {
    this.userId = userId;
    this.postId = postId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  postId: string;
}

export class GetCommentDTO {
  constructor(userId: string, postId: string) {
    this.userId = userId;
    this.postId = postId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  postId: string;
}

export class GetCommentsFromUserDTO {
  constructor(userId: string, authorId: string) {
    this.userId = userId;
    this.authorId = authorId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  authorId: string;
}

export class GetParentPostDTO {
  constructor(parentPostId: string) {
    this.parentPostId = parentPostId;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  parentPostId: string;
}
