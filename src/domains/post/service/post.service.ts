import { ExtendedPostDTO, PostDTO } from '../dto';

export interface PostService {
  createPost: (userId: string, content: string, images?: string[]) => Promise<PostDTO>;
  deletePost: (userId: string, postId: string) => Promise<void>;
  getPost: (userId: string, postId: string) => Promise<PostDTO>;
  getLatestPosts: (
    userId: string,
    options: {
      limit?: number;
      before?: string;
      after?: string;
    }
  ) => Promise<ExtendedPostDTO[]>;
  getPostsByAuthor: (userId: string, authorId: string) => Promise<ExtendedPostDTO[]>;
}
