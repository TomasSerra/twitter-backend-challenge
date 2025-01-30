import {
  CreatePostDTO,
  DeletePostDTO,
  ExtendedPostDTO,
  GetPostDTO,
  PostDTO,
  PostsByAuthorDTO,
  PreSignedUrl,
} from '../dto';

import { PostRepository } from '../repository';
import { PostService } from '.';
import { validate } from 'class-validator';
import {
  ForbiddenException,
  generatePreSignedUrl,
  generatePreSignedUrls,
  InvalidUserException,
  NotFoundException,
  ValidationException,
} from '@utils';
import { CursorPagination } from '@types';
import { UserRepository } from '@domains/user/repository';

export class PostServiceImpl implements PostService {
  constructor(private readonly repository: PostRepository, private readonly userValidationRepository: UserRepository) {}

  async createPost(userId: string, content: string, images?: string[]): Promise<PostDTO> {
    const data = new CreatePostDTO(userId, content, images);

    if (data.images?.length) {
      const urls: PreSignedUrl[] = await generatePreSignedUrls(data.images);
      data.images = urls.map((url) => url.signedUrl);
    }
    return await this.repository.create(data);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const data = new DeletePostDTO(userId, postId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    const post = await this.repository.getById(postId);
    // only the post owner can delete its own post
    if (!post) throw new NotFoundException('post');
    if (post.authorId !== userId) throw new ForbiddenException();
    await this.repository.delete(postId);
  }

  async getPost(userId: string, postId: string): Promise<ExtendedPostDTO> {
    const data = new GetPostDTO(userId, postId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    const post = await this.repository.getById(postId);

    if (!post) throw new NotFoundException('post');
    const result = await this.userValidationRepository.isUserPublicOrFollowed(userId, post.authorId);
    if (!result) {
      throw new InvalidUserException();
    }
    if (post.images.length) {
      const preSignedUrls = await generatePreSignedUrls(post.images);
      post.images = preSignedUrls.map((url) => url.signedUrl);
    }

    return post;
  }

  async getLatestPosts(userId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    const posts = await this.repository.getAllByDatePaginated(userId, options);
    if (!posts.length) throw new NotFoundException('posts');

    for (const post of posts) {
      if (post.images.length) {
        const preSignedUrls = await generatePreSignedUrls(post.images);
        post.images = preSignedUrls.map((url) => url.signedUrl);
      }

      if (post.author.profilePicture) {
        const preSignedUrl = await generatePreSignedUrl(post.author.profilePicture);
        post.author.profilePicture = preSignedUrl.signedUrl;
      }
    }
    return posts;
  }

  async getPostsByAuthor(userId: string, authorId: string): Promise<ExtendedPostDTO[]> {
    const data = new PostsByAuthorDTO(userId, authorId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const result = await this.userValidationRepository.isUserPublicOrFollowed(data.userId, data.authorId);
    if (!result) {
      throw new InvalidUserException();
    }
    const posts = await this.repository.getByAuthorId(data.authorId);

    if (!posts.length) throw new NotFoundException('authors');

    for (const post of posts) {
      if (post.images.length) {
        const preSignedUrls = await generatePreSignedUrls(post.images);
        post.images = preSignedUrls.map((url) => url.signedUrl);
      }

      if (post?.author?.profilePicture) {
        const preSignedUrl = await generatePreSignedUrl(post.author.profilePicture);
        post.author.profilePicture = preSignedUrl.signedUrl;
      }
    }

    return posts;
  }
}
