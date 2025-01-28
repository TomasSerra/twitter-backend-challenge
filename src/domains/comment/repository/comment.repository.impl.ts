import { PrismaClient, ReactionAction } from '@prisma/client';

import { CommentRepository } from '@domains/comment/repository/comment.repository';
import { ExtendedPostDTO, PostContentDTO } from '@domains/post/dto';
import { CommentDTO } from '@domains/comment/dto';
import { CursorPagination } from '@types';

export class CommentRepositoryImpl implements CommentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(authorId: string, parentPostId: string, data: PostContentDTO): Promise<CommentDTO> {
    const commentPost = await this.db.post.create({
      data: {
        authorId,
        parentPostId,
        content: data.content,
        images: data.images,
      },
    });

    return new CommentDTO(commentPost);
  }

  async delete(postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId,
      },
    });
  }

  async getAllCommentsFromPost(postId: string, options: CursorPagination): Promise<CommentDTO[]> {
    const comments = await this.db.post.findMany({
      cursor: options.after ? { id: options.after } : options.before ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      include: {
        reactions: {
          orderBy: {
            action: 'asc',
          },
        },
      },
      where: {
        parentPostId: postId,
      },
    });
    return comments.map((comment) => new CommentDTO(comment));
  }

  async getAllCommentsFromUser(authorId: string): Promise<CommentDTO[]> {
    const comments = await this.db.post.findMany({
      where: {
        authorId,
        NOT: {
          parentPostId: null,
        },
      },
    });
    return comments.map((comment) => new CommentDTO(comment));
  }

  async getById(postId: string): Promise<CommentDTO | null> {
    const commentPost = await this.db.post.findUnique({
      where: {
        id: postId,
      },
    });

    return commentPost !== null ? new CommentDTO(commentPost) : null;
  }

  async getParentPost(postId: string): Promise<ExtendedPostDTO | null> {
    const postWithAuthor = await this.db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        comments: true,
        reactions: true,
      },
    });

    if (postWithAuthor === null) return null;

    const qtyLikes = postWithAuthor.reactions.filter((reaction) => reaction.action === ReactionAction.LIKE).length;
    const qtyRetweets = postWithAuthor.reactions.filter(
      (reaction) => reaction.action === ReactionAction.RETWEET
    ).length;
    const qtyComments = postWithAuthor.comments.length;

    return new ExtendedPostDTO({ ...postWithAuthor, qtyLikes, qtyRetweets, qtyComments });
  }

  async checkIfAuthorExists(authorId: string): Promise<boolean> {
    const author = await this.db.user.findUnique({
      where: {
        id: authorId,
      },
    });

    return !!author;
  }

  async checkIfParentPostExists(postId: string): Promise<boolean> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId,
      },
    });

    return !!post;
  }
}
