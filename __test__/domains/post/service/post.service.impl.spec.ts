import { UserRepositoryImpl } from '@domains/user/repository';
import {
  generatePreSignedUrl,
  generatePreSignedUrls,
  InvalidUserException,
  NotFoundException,
  ValidationException,
} from '@utils';
import { PostService, PostServiceImpl } from '@domains/post/service';
import { PostRepositoryImpl } from '@domains/post/repository';
import { ExtendedPostDTO, PostDTO, PreSignedUrl } from '@domains/post/dto';
import { validate } from 'class-validator';
import { mock } from 'jest-mock-extended';
import { _MockProxy } from 'jest-mock-extended/lib/Mock';
import { ExtendedUserDTO } from '@domains/user/dto';
import { Visibility } from '@prisma/client';

jest.mock('src/domains/post/repository/post.repository.impl');
jest.mock('class-validator');
jest.mock('src/utils/s3Bucket');

const mockGeneratePreSignedUrl = generatePreSignedUrl as jest.MockedFunction<typeof generatePreSignedUrl>;
const mockGeneratePreSignedUrls = generatePreSignedUrls as jest.MockedFunction<typeof generatePreSignedUrls>;
const mockValidate = validate as jest.MockedFunction<typeof validate>;

describe('PostServiceImpl', () => {
  let postService: PostService;

  let postRepositoryMock: _MockProxy<PostRepositoryImpl>;
  let userValidationRepositoryMock: _MockProxy<UserRepositoryImpl>;

  beforeEach(() => {
    postRepositoryMock = mock<PostRepositoryImpl>();
    userValidationRepositoryMock = mock<UserRepositoryImpl>();
    postService = new PostServiceImpl(postRepositoryMock, userValidationRepositoryMock);
    jest.resetAllMocks(); // Reset mocks before each test
  });

  describe('createPost', () => {
    it('should create a post with images', async () => {
      const preSignedUrls: PreSignedUrl[] = [
        { signedUrl: 'preSignedUrl 1', key: 'key 1' },
        { signedUrl: 'preSignedUrl 2', key: 'key 2' },
        { signedUrl: 'preSignedUrl 3', key: 'key 3' },
      ];

      (generatePreSignedUrls as jest.Mock).mockResolvedValue(preSignedUrls);

      const userIdMock = 'author 1';
      const contentMock = 'hola';
      const imagesMock = ['image 1', 'image 2', 'image 3'];

      const postMock: PostDTO = {
        id: 'post 1',
        authorId: userIdMock,
        content: contentMock,
        images: ['key 1', 'key 2', 'key 3'],
        createdAt: new Date(),
      };

      postRepositoryMock.create.mockResolvedValue(postMock);
      const results = await postService.createPost(userIdMock, contentMock, imagesMock);
      expect(results).toEqual(postMock);
      expect(generatePreSignedUrls).toHaveBeenCalled();
    });

    it('should create a post with no images', async () => {
      (validate as jest.Mock).mockResolvedValue([]);

      const userIdMock = 'author 1';
      const contentMock = 'hola';

      const postMock: PostDTO = {
        id: 'post 1',
        authorId: userIdMock,
        content: contentMock,
        images: [],
        createdAt: new Date(),
      };

      postRepositoryMock.create.mockResolvedValue(postMock);
      const results = await postService.createPost(userIdMock, contentMock, undefined);

      expect(results).toEqual(postMock);
      expect(generatePreSignedUrls).not.toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const userIdMock: string = 'user 1';
      const postIdMock: string = 'post 1';
      const contentMock: string = 'content post 1';
      const postMock: PostDTO = {
        id: postIdMock,
        authorId: userIdMock,
        content: contentMock,
        images: [],
        createdAt: new Date(),
      };

      (validate as jest.Mock).mockResolvedValue([]);
      const deletePostSpy = jest.spyOn(postService, 'deletePost');

      postRepositoryMock.getById.mockResolvedValue(postMock);

      postRepositoryMock.delete.mockResolvedValue();

      await postService.deletePost(userIdMock, postIdMock);
      expect(deletePostSpy).toHaveBeenCalledWith(userIdMock, postIdMock);
    });

    it('should throw ValidationException', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      const userIdMock: string = '';
      const postIdMock: string = 'post 1';
      const validationErrors = [{ property: 'authorId', constraints: { isNotEmpty: 'authorId should not be empty' } }];

      (validate as jest.Mock).mockResolvedValue(validationErrors);
      const getByIdSpy = jest.spyOn(postRepositoryMock, 'getById');
      const deletePostSpy = jest.spyOn(postService, 'deletePost');

      await expect(postService.deletePost(userIdMock, postIdMock)).rejects.toThrow(ValidationException);
      expect(getByIdSpy).not.toHaveBeenCalled();
      expect(deletePostSpy).toHaveBeenCalledWith(userIdMock, postIdMock);
    });

    it('should throw NotFoundException', async () => {
      (validate as jest.Mock).mockResolvedValue([]);
      const userIdMock: string = '';
      const postIdMock: string = 'post 1';

      (validate as jest.Mock).mockResolvedValue([]);
      const getByIdSpy = jest.spyOn(postRepositoryMock, 'getById');
      const deletePostSpy = jest.spyOn(postService, 'deletePost');

      postRepositoryMock.getById.mockResolvedValue(null);

      await expect(postService.deletePost(userIdMock, postIdMock)).rejects.toThrow(NotFoundException);
      expect(getByIdSpy).toHaveBeenCalled();
      expect(deletePostSpy).toHaveBeenCalledWith(userIdMock, postIdMock);
    });
  });

  describe('getPost', () => {
    it('should return a post', async () => {
      const userIdMock: string = 'user 1';
      const postIdMock: string = 'post 1';
      const contentMock: string = 'content post 1';
      const postMock: PostDTO | null = {
        id: postIdMock,
        authorId: userIdMock,
        content: contentMock,
        images: [],
        createdAt: new Date(),
      };

      postRepositoryMock.getById.mockResolvedValue(postMock);
      userValidationRepositoryMock.isUserPublicOrFollowed.mockResolvedValue(true);

      mockValidate.mockResolvedValue([]);

      const results = await postService.getPost(userIdMock, postIdMock);
      expect(results).toEqual(postMock);
    });

    it('should throw ValidationException', async () => {
      const userIdMock: string = '';
      const postIdMock: string = 'post 1';
      const validationErrors = [{ property: 'authorId', constraints: { isNotEmpty: 'authorId should not be empty' } }];

      mockValidate.mockResolvedValue(validationErrors);
      await expect(postService.getPost(userIdMock, postIdMock)).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundException', async () => {
      const userIdMock: string = 'userId 1';
      const postIdMock: string = 'post 1';

      mockValidate.mockResolvedValue([]);
      postRepositoryMock.getById.mockResolvedValue(null);
      await expect(postService.getPost(userIdMock, postIdMock)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestPosts', () => {
    it('should return list of ExtendedPostDTO with options', async () => {
      const posts = [
        {
          id: 'post1',
          authorId: 'user123',
          content: 'Enjoying a sunny day at the beach! ☀️',
          images: ['beach1.jpg', 'beach2.jpg'],
          createdAt: new Date('2024-07-30'),
          author: {
            id: 'user123',
            name: 'Alice Johnson',
            username: 'alice_j',
            profilePicture: 'alice.jpg',
            createdAt: new Date('2023-05-10'),
            updatedAt: new Date('2024-07-20'),
            email: 'alice@example.com',
            password: 'hashedPassword123',
            visibility: Visibility.PUBLIC,
          },
          qtyComments: 12,
          qtyLikes: 35,
          qtyRetweets: 5,
        },
        {
          id: 'post2',
          authorId: 'user123',
          content: 'Just finished reading a great book. Highly recommend it! 📚',
          images: [],
          createdAt: new Date('2024-07-25'),
          author: {
            id: 'user123',
            name: 'Alice Johnson',
            username: 'alice_j',
            profilePicture: 'alice.jpg',
            createdAt: new Date('2023-05-10'),
            updatedAt: new Date('2024-07-20'),
            email: 'alice@example.com',
            password: 'hashedPassword123',
            visibility: Visibility.PUBLIC,
          },
          qtyComments: 2,
          qtyLikes: 8,
          qtyRetweets: 0,
        },
      ];

      const mockOptions = {
        cursor: null,
        limit: 2,
      };

      postRepositoryMock.getAllByDatePaginated.mockResolvedValue(posts);
      mockGeneratePreSignedUrls.mockResolvedValue([
        { signedUrl: 'preSignedBeach1.jpg', key: 'beach1.jpg' },
        { signedUrl: 'preSignedBeach2.jpg', key: 'beach2.jpg' },
      ]);
      mockGeneratePreSignedUrl.mockResolvedValue({ signedUrl: 'preSignedAlice.jpg', key: 'alice.jpg' });

      const result = await postService.getLatestPosts('loggedUserId1', mockOptions);

      expect(result).toEqual(
        posts.map((post) => ({
          ...post,
          images: post.images.map((image) => `${image}`),
          author: {
            ...post.author,
            profilePicture: 'preSignedAlice.jpg',
          },
        }))
      );
    });
    it('should throw NotFoundException', async () => {
      const mockedUserId = 'myUserId';
      const mockedOptions = { limit: 2, after: 'beforeCursorId' };

      postRepositoryMock.getAllByDatePaginated.mockResolvedValue([]);
      await expect(postService.getLatestPosts(mockedUserId, mockedOptions)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPostsByAuthor', () => {
    it('should return a list of ExtendedPostDTO', async () => {
      // Author 1: Alice Johnson
      const author1: ExtendedUserDTO = {
        id: 'user123',
        name: 'Alice Johnson',
        username: 'alice_j',
        profilePicture: 'alice.jpg',
        createdAt: new Date('2023-05-10'),
        updatedAt: new Date('2024-07-20'),
        email: 'alice@example.com',
        password: 'hashedPassword123',
        visibility: Visibility.PUBLIC,
      };

      // Post 1 by Alice
      const extendedPost1: ExtendedPostDTO = {
        id: 'post1',
        authorId: 'user123',
        content: 'Enjoying a sunny day at the beach! ☀️',
        images: ['beach1.jpg', 'beach2.jpg'],
        createdAt: new Date('2024-07-30'),
        author: author1,
        qtyComments: 12,
        qtyLikes: 35,
        qtyRetweets: 5,
      };

      // Post 2 by Alice
      const extendedPost2: ExtendedPostDTO = {
        id: 'post2',
        authorId: 'user123',
        content: 'Just finished reading a great book. Highly recommend it! 📚',
        images: [],
        createdAt: new Date('2024-07-25'),
        author: author1,
        qtyComments: 2,
        qtyLikes: 8,
        qtyRetweets: 0,
      };

      const loggedUserMockId = 'loggedUserId1';
      mockValidate.mockResolvedValue([]);
      userValidationRepositoryMock.isUserPublicOrFollowed.mockResolvedValue(true);
      postRepositoryMock.getByAuthorId.mockResolvedValue([extendedPost1, extendedPost2]);
      mockGeneratePreSignedUrls.mockResolvedValue([
        { signedUrl: 'preSignedBeach1.jpg', key: 'beach1.jpg' },
        { signedUrl: 'preSignedBeach2.jpg', key: 'beach2.jpg' },
      ]);
      mockGeneratePreSignedUrl.mockResolvedValue({ signedUrl: 'preSignedAlice.jpg', key: 'alice.jpg' });

      const results = await postService.getPostsByAuthor(loggedUserMockId, author1.id);

      expect(results).toEqual([extendedPost1, extendedPost2]);
    });

    it('should throw ValidationException', async () => {
      const userIdMock: string = '';
      const validationErrors = [{ property: 'authorId', constraints: { isNotEmpty: 'authorId should not be empty' } }];

      mockValidate.mockResolvedValue(validationErrors);
      await expect(postService.getPostsByAuthor(userIdMock, 'otherUserId')).rejects.toThrow(ValidationException);
    });

    it('should throw InvalidUserException if user does not follow the other user', async () => {
      userValidationRepositoryMock.isUserPublicOrFollowed.mockResolvedValue(false);
      mockValidate.mockResolvedValue([]);

      await expect(postService.getPostsByAuthor('userMockId', 'otherUserMockId')).rejects.toThrow(InvalidUserException);
    });

    it('should throw NotFoundException if otheruser does not have any posts', async () => {
      userValidationRepositoryMock.isUserPublicOrFollowed.mockResolvedValue(true);
      mockValidate.mockResolvedValue([]);
      postRepositoryMock.getByAuthorId.mockResolvedValue([]);

      await expect(postService.getPostsByAuthor('userMockId', 'otherUserMockId')).rejects.toThrow(NotFoundException);
    });
  });
});
