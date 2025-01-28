import { PrismaClient, ReactionAction } from '@prisma/client';

import { ReactionRepository } from '.';
import { CreateReactionDTO, ReactionDTO } from '../dto';

export class ReactionRepositoryImpl implements ReactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateReactionDTO): Promise<ReactionDTO> {
    const reaction = await this.db.reaction.create({
      data: {
        authorId: data.userId,
        postId: data.postId,
        action: data.action,
      },
    });

    return new ReactionDTO(reaction);
  }

  async delete(authorId: string, postId: string, reactionAction: ReactionAction): Promise<boolean> {
    const reactionToDelete = await this.db.reaction.findFirst({
      where: {
        authorId,
        postId,
        action: reactionAction,
      },
      select: {
        id: true,
      },
    });
    if (!reactionToDelete) return false;

    await this.db.reaction.delete({
      where: {
        id: reactionToDelete.id,
      },
    });

    return true;
  }

  // make better checks later
  async getAllReactions(): Promise<ReactionDTO[]> {
    const reactions = await this.db.reaction.findMany({});

    return reactions.map((reaction) => new ReactionDTO(reaction));
  }

  async getByReactionId(reactionId: string): Promise<ReactionDTO | null> {
    const reaction = await this.db.reaction.findUnique({
      where: {
        id: reactionId,
      },
    });

    return reaction !== null ? new ReactionDTO(reaction) : null;
  }

  async getAllReactionsFromUser(authorId: string): Promise<ReactionDTO[]> {
    const reactions = await this.db.reaction.findMany({
      where: {
        authorId,
      },
    });

    return reactions.map((reaction) => new ReactionDTO(reaction));
  }

  async getAllReactionsFromPost(postId: string): Promise<ReactionDTO[]> {
    const reactions = await this.db.reaction.findMany({
      where: {
        postId,
      },
    });
    return reactions.map((reaction) => new ReactionDTO(reaction));
  }

  async getAllLikesFromUser(userId: string): Promise<ReactionDTO[]> {
    const likes = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        action: ReactionAction.LIKE,
      },
    });

    return likes.map((like) => new ReactionDTO(like));
  }

  async getAllRetweetsFromUser(userId: string): Promise<ReactionDTO[]> {
    const retweets = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        action: ReactionAction.RETWEET,
      },
    });

    return retweets.map((retweet) => new ReactionDTO(retweet));
  }

  async getAuthorIdOfPost(postId: string): Promise<string | null> {
    const authorId = await this.db.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    });
    if (!authorId) return null;
    return authorId.authorId;
  }

  async checkReactionExists(authorId: string, postId: string, reactionAction: ReactionAction): Promise<boolean> {
    const oldReaction = await this.db.reaction.findFirst({
      where: {
        authorId,
        postId,
        action: reactionAction,
      },
    });

    return !!oldReaction;
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });
    return !!user;
  }

  async postExists(postId: string): Promise<boolean> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId,
      },
    });
    return !!post;
  }
}
