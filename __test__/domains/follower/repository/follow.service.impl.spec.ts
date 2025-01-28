import { ConflictException, NotFoundException, ValidationException } from '@utils';
import { FollowerService, FollowerServiceImpl } from '@domains/follower/service';
import { FollowerRepositoryImpl } from '@domains/follower/repository';
import { _MockProxy } from 'jest-mock-extended/lib/Mock';
import { mock } from 'jest-mock-extended';
import { FollowerDTO } from '@domains/follower/dto';
import { validate } from 'class-validator';

jest.mock('src/domains/post/repository/post.repository.impl');
jest.mock('class-validator');
jest.mock('src/utils/s3Bucket');

const mockValidate = validate as jest.MockedFunction<typeof validate>;

describe('follow service impl', () => {
  let followService: FollowerService;

  let followRepositoryMock: _MockProxy<FollowerRepositoryImpl>;

  beforeEach(() => {
    followRepositoryMock = mock<FollowerRepositoryImpl>();
    followService = new FollowerServiceImpl(followRepositoryMock);
    jest.resetAllMocks();
  });

  describe('createFollower', () => {
    it('should create a follow and return a FollowerDTO', async () => {
      const followerData: FollowerDTO = {
        id: 'follow-relationship-123',
        followerId: 'user-456', // The ID of the user who is following
        followedId: 'user-789', // The ID of the user being followed
        createdAt: new Date(), // You can set a specific date or use the current date/time
      };

      mockValidate.mockResolvedValue([]);
      followRepositoryMock.userExists.mockResolvedValue(true);
      followRepositoryMock.getById.mockResolvedValue(null);
      followRepositoryMock.create.mockResolvedValue(followerData);

      const result = await followService.createFollower(followerData.followerId, followerData.followedId);

      expect(followRepositoryMock.create).toHaveBeenCalledWith({
        followerId: followerData.followerId,
        followedId: followerData.followedId,
      });

      expect(result).toEqual(followerData);
    });

    it('should throw ValidationException', async () => {
      const validationErrors = [
        {
          property: 'followerId',
          constraints: { isNotEmpty: 'followerId should not be empty' },
        },
      ];

      mockValidate.mockResolvedValue(validationErrors);
      await expect(followService.createFollower('', 'followedId')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundException followerId is not from a valid user', async () => {
      mockValidate.mockResolvedValue([]);
      followRepositoryMock.userExists.mockResolvedValue(false);

      await expect(followService.createFollower('followerId', 'nonExistantFollowedId')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException user can not follow itself', async () => {
      mockValidate.mockResolvedValue([]);
      followRepositoryMock.userExists.mockResolvedValue(true);

      await expect(followService.createFollower('followerId', 'followerId')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException follow already Exists', async () => {
      const followerData: FollowerDTO = {
        id: 'follow-relationship-123',
        followerId: 'user-456', // The ID of the user who is following
        followedId: 'user-789', // The ID of the user being followed
        createdAt: new Date(), // You can set a specific date or use the current date/time
      };

      mockValidate.mockResolvedValue([]);
      followRepositoryMock.userExists.mockResolvedValue(true);
      followRepositoryMock.getById.mockResolvedValue(followerData);

      await expect(followService.createFollower(followerData.followerId, followerData.followedId)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('deleteFollower', () => {
    it('should delete a follow', async () => {
      const followerDataToDelete: FollowerDTO = {
        id: 'follow-relationship-123',
        followerId: 'user-456', // The ID of the user who is following
        followedId: 'user-789', // The ID of the user being followed
        createdAt: new Date(), // You can set a specific date or use the current date/time
      };
      const deleteFollowerSpy = jest.spyOn(followService, 'deleteFollower');
      mockValidate.mockResolvedValue([]);
      followRepositoryMock.getById.mockResolvedValue(followerDataToDelete);
      followRepositoryMock.delete.mockResolvedValue();

      await followService.deleteFollower(followerDataToDelete.followerId, followerDataToDelete.followedId);

      expect(deleteFollowerSpy).toHaveBeenCalledWith(followerDataToDelete.followerId, followerDataToDelete.followedId);
    });

    it('should throw ValidationException', async () => {
      const validationErrors = [
        {
          property: 'followerId',
          constraints: { isNotEmpty: 'followerId should not be empty' },
        },
      ];

      mockValidate.mockResolvedValue(validationErrors);
      await expect(followService.deleteFollower('', 'followedId')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundException follow to delete does not exists', async () => {
      mockValidate.mockResolvedValue([]);
      followRepositoryMock.getById.mockResolvedValue(null);

      await expect(followService.deleteFollower('followerId', 'followedId')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFollow', () => {
    it('should return a FollowerDTO', async () => {
      const followerData: FollowerDTO = {
        id: 'follow-relationship-123',
        followerId: 'user-456', // The ID of the user who is following
        followedId: 'user-789', // The ID of the user being followed
        createdAt: new Date(), // You can set a specific date or use the current date/time
      };

      mockValidate.mockResolvedValue([]);
      followRepositoryMock.getById.mockResolvedValue(followerData);
      const result = await followService.getFollow(followerData.followerId, followerData.followedId);
      expect(result).toEqual(followerData);
    });

    it('should throw ValidationException', async () => {
      const validationErrors = [
        {
          property: 'followerId',
          constraints: { isNotEmpty: 'followerId should not be empty' },
        },
      ];
      mockValidate.mockResolvedValue(validationErrors);

      await expect(followService.getFollow('followerId', 'followedId')).rejects.toThrow(ValidationException);
    });

    it('should throw NotFoundException', async () => {
      const followerData: FollowerDTO = {
        id: 'follow-relationship-123',
        followerId: 'user-456', // The ID of the user who is following
        followedId: 'user-789', // The ID of the user being followed
        createdAt: new Date(), // You can set a specific date or use the current date/time
      };

      mockValidate.mockResolvedValue([]);
      followRepositoryMock.getById.mockResolvedValue(followerData);
      const result = await followService.getFollow(followerData.followerId, followerData.followedId);
      expect(result).toEqual(followerData);
    });
  });

  describe('getAllFollows', () => {
    it('should return a list of all follows as FollowerDTO', async () => {
      const followerList: FollowerDTO[] = [
        new FollowerDTO({
          id: 'follow-relationship-123',
          followerId: 'user-456',
          followedId: 'user-789',
          createdAt: new Date('2024-07-20T10:30:00Z'),
        }),
        new FollowerDTO({
          id: 'follow-relationship-987',
          followerId: 'user-111',
          followedId: 'user-222',
          createdAt: new Date('2023-12-15T18:45:30Z'),
        }),
        new FollowerDTO({
          id: 'follow-relationship-555',
          followerId: 'user-333',
          followedId: 'user-456', // Notice that user-456 is now being followed
          createdAt: new Date(),
        }),
      ];

      followRepositoryMock.getAllFollows.mockResolvedValue(followerList);

      await expect(followService.getAllFollows()).resolves.toEqual(followerList);
    });

    it('should throw NotFoundException', async () => {
      followRepositoryMock.getAllFollows.mockResolvedValue([]);

      await expect(followService.getAllFollows()).rejects.toThrow(NotFoundException);
    });
  });
});
