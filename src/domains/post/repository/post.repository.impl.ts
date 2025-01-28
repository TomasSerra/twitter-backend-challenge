import { PrismaClient, ReactionAction, Visibility } from '@prisma/client';

import { CursorPagination } from '@types';

import { PostRepository } from '.';
import { CreatePostDTO, ExtendedPostDTO, PostDTO } from '../dto';

export class PostRepositoryImpl implements PostRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(postData: CreatePostDTO): Promise<PostDTO> {
    const post = await this.db.post.create({
      data: {
        authorId: postData.userId,
        content: postData.content,
        images: postData.images
      },
    });
    return new PostDTO(post);
  }

  async getAllByDatePaginated(userId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    const userFollows = await this.db.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followedId: true,
      },
    });

    const followedIds = userFollows.map((follow) => follow.followedId);

    const posts = await this.db.post.findMany({
      where: {
        OR: [
          {
            author: {
              visibility: Visibility.PUBLIC,
            },
          },
          {
            author: {
              visibility: Visibility.PRIVATE,
              id: { in: followedIds },
            },
          },
        ],
      },

      include: {
        author: true,
        reactions: true,
        comments: true,
      },

      cursor: options.after ? { id: options.after } : options.before ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return posts.map((post) => {
      const qtyLikes = post.reactions.filter((reaction) => reaction.action === ReactionAction.LIKE).length;
      const qtyRetweets = post.reactions.filter((reaction) => reaction.action === ReactionAction.RETWEET).length;
      const qtyComments = post.comments.length;

      return new ExtendedPostDTO({ ...post, qtyComments, qtyLikes, qtyRetweets });
    });
  }

  async delete(postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId,
      },
    });
  }

  async getById(postId: string): Promise<PostDTO | null> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId,
      },
    });
    return post != null ? new PostDTO(post) : null;
  }

  async getByAuthorId(authorId: string): Promise<ExtendedPostDTO[]> {
    const posts = await this.db.post.findMany({
      where: {
        authorId,
      },
      include: {
        author: true,
        comments: true,
        reactions: true,
      },
    });

    return posts.map((post) => {
      const qtyLikes = post.reactions.filter((reaction) => reaction.action === ReactionAction.LIKE).length;
      const qtyRetweets = post.reactions.filter((reaction) => reaction.action === ReactionAction.RETWEET).length;
      const qtyComments = post.comments.length;

      return new ExtendedPostDTO({ ...post, qtyLikes, qtyRetweets, qtyComments });
    });
  }
}
