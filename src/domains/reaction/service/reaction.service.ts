import { CreateReactionDTO, DeleteReactionDTO, ReactionDTO } from '@domains/reaction/dto';

export interface ReactionService {
  createReaction: (reaction: CreateReactionDTO) => Promise<ReactionDTO>;
  deleteReaction: (reactionDeleteDTO: DeleteReactionDTO) => Promise<void>;

  getReaction: (reactionId: string) => Promise<ReactionDTO>;
  getAllReactions: () => Promise<ReactionDTO[]>;

  getReactionsFromUser: (userId: string, authorId: string) => Promise<ReactionDTO[]>;
  getReactionsFromPost: (userId: string, postId: string) => Promise<ReactionDTO[]>;

  getAllLikesFromUser: (userId: string, authorId: string) => Promise<ReactionDTO[]>;
  getAllRetweetsFromUser: (userId: string, authorId: string) => Promise<ReactionDTO[]>;
}
