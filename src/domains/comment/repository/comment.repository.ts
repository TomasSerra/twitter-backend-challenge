import { ExtendedPostDTO, PostContentDTO } from '@domains/post/dto';
import { CommentDTO } from '@domains/comment/dto';
import { CursorPagination } from '@types';

export interface CommentRepository {
  create: (userId: string, parentPostId: string, data: PostContentDTO) => Promise<CommentDTO>;
  delete: (postId: string) => Promise<void>;

  getAllCommentsFromPost: (postId: string, options: CursorPagination) => Promise<CommentDTO[]>;
  getAllCommentsFromUser: (userId: string) => Promise<CommentDTO[]>;
  getById: (postId: string) => Promise<CommentDTO | null>;

  getParentPost: (postId: string) => Promise<ExtendedPostDTO | null>;

  checkIfParentPostExists:(postId: string)=> Promise<boolean>;
  checkIfAuthorExists:(postId: string)=> Promise<boolean>;
}
