import { CreateReactionDTO, ReactionDTO } from '../dto';
import { ReactionAction } from '@prisma/client';

export interface ReactionRepository {
  create: (data: CreateReactionDTO) => Promise<ReactionDTO>;
  delete: (authorId: string, postId: string, reactionAction: ReactionAction) => Promise<boolean>;
  getByReactionId: (reactionId: string) => Promise<ReactionDTO | null>;
  getAllReactionsFromUser: (userId: string) => Promise<ReactionDTO[]>;
  getAllReactionsFromPost: (postId: string) => Promise<ReactionDTO[]>;
  getAllReactions: () => Promise<ReactionDTO[]>;

  getAllLikesFromUser: (userId: string) => Promise<ReactionDTO[]>;
  getAllRetweetsFromUser: (userId: string) => Promise<ReactionDTO[]>;

  checkReactionExists: (authorId: string, postId: string, reactionAction: ReactionAction) => Promise<boolean>;
  userExists:(authorId: string) => Promise<boolean>;
  postExists:(postId:string)=>Promise<boolean>;

  getAuthorIdOfPost: (postId: string) => Promise<string | null>;
}
