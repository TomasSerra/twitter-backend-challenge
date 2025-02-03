import { CursorPagination } from '@types';
import { CreatePostDTO, ExtendedPostDTO, PostDTO } from '../dto';

export interface PostRepository {
  create: (postData: CreatePostDTO) => Promise<PostDTO>;
  delete: (postId: string) => Promise<void>;

  getById: (userId: string, postId: string) => Promise<ExtendedPostDTO | null>;
  getByAuthorId: (authorId: string) => Promise<ExtendedPostDTO[]>;
  getAllByDatePaginated: (usedId: string, options: CursorPagination) => Promise<ExtendedPostDTO[]>;
}
