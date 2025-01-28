import { ExtendedPostDTO, PostContentDTO } from '@domains/post/dto';
import { CommentDTO } from '@domains/comment/dto';
import { OffsetPagination } from '@types';

export interface CommentService {
  createComment: (userId: string, postId: string, data: PostContentDTO) => Promise<CommentDTO>;
  deleteComment: (userId: string, postId: string) => Promise<void>;

  getComment: (userId: string, postId: string) => Promise<CommentDTO>;
  getAllCommentsFromPostPaginated: (userId: string, postId: string, options: OffsetPagination) => Promise<CommentDTO[]>;
  getAllCommentsFromUser: (userId: string, authorId: string) => Promise<CommentDTO[]>;

  getParentPost: (parentPostId: string) => Promise<ExtendedPostDTO | null>;
}
