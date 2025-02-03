import { ArrayMaxSize, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ExtendedUserDTO } from '@domains/user/dto';
import { Reaction } from '@prisma/client';

export class CreatePostDTO {
  constructor(userId: string, content: string, images?: string[]) {
    this.userId = userId;
    this.content = content;
    this.images = images;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  content!: string;

  @IsOptional()
  @ArrayMaxSize(4)
  @MaxLength(100, {
    each: true,
  })
  images?: string[];
}

export class PostContentDTO {
  constructor(content: string, images?: string[]) {
    this.content = content;
    this.images = images;
  }

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  content!: string;

  @IsOptional()
  @ArrayMaxSize(4)
  @MaxLength(100, {
    each: true,
  })
  images?: string[];
}

export class PostDTO {
  constructor(post: PostDTO) {
    this.id = post.id;
    this.authorId = post.authorId;
    this.content = post.content;
    this.images = post.images;
    this.createdAt = post.createdAt;
  }

  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: Date;
}

export class PostsByAuthorDTO {
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

export class GetPostDTO {
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

export class DeletePostDTO {
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

export interface PreSignedUrl {
  signedUrl: string;
  key: string;
}

export class ExtendedPostDTO extends PostDTO {
  constructor(post: ExtendedPostDTO) {
    super(post);
    this.author = post.author;
    this.qtyComments = post.qtyComments;
    this.qtyLikes = post.qtyLikes;
    this.qtyRetweets = post.qtyRetweets;
    this.reactions = post.reactions;
  }

  author!: ExtendedUserDTO;
  qtyComments!: number;
  qtyLikes!: number;
  qtyRetweets!: number;
  reactions!: Reaction[];
}
