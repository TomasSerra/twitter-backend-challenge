import { UserService, UserServiceImpl } from '@domains/user/service';
import { UserRepositoryImpl } from '@domains/user/repository';
import { db, encryptPassword, generatePreSignedUrl, NotFoundException } from '@utils';
import { UserDTO, UserUpdateInputDTO, UserUpdateOutputDTO, UserViewDTO } from '@domains/user/dto';
import { Visibility } from '@prisma/client';


jest.mock('src/domains/user/repository/user.repository.impl');
jest.mock('src/utils/s3Bucket');
jest.mock('src/utils/auth');

const mockEncryptPassword = encryptPassword as jest.MockedFunction<typeof encryptPassword>;
const mockGeneratePreSignedUrl = generatePreSignedUrl as jest.MockedFunction<typeof generatePreSignedUrl>;

describe('UserServiceImpl', () => {
  let userService: UserService;
  let userRepositoryMock: jest.Mocked<UserRepositoryImpl>;

  beforeEach(() => {
    userRepositoryMock = new UserRepositoryImpl(db) as jest.Mocked<UserRepositoryImpl>;
    userService = new UserServiceImpl(userRepositoryMock);
    jest.resetAllMocks();
  });

  describe('getUser', () => {
    it('should return a valid user', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: 'user',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);

      const result = await userService.getUser('1');
      expect(result).toEqual(userMockData);
    });
  });

  describe('getUserRecomendations', () => {
    it('should return a list of UserViewDTO with 0 Pagination options', async () => {
      const usersMockData: UserViewDTO[] = [
        {
          id: '321',
          name: '',
          username: 'username1',
          profilePicture: null,
        },
        {
          id: '123',
          name: '',
          username: 'username2',
          profilePicture: 'profilePicture2.png',
        },
        {
          id: '23',
          name: '',
          username: 'username3',
          profilePicture: 'profilePicture3.png',
        },
      ];
      const expectedResults: UserViewDTO[] = [
        {
          id: '321',
          name: '',
          username: 'username1',
          profilePicture: null,
        },
        {
          id: '123',
          name: '',
          username: 'username2',
          profilePicture: 'profilePicture2.png',
        },
        {
          id: '23',
          name: '',
          username: 'username3',
          profilePicture: 'profilePicture3.png',
        },
      ];

      userRepositoryMock.getRecommendedUsersPaginated.mockResolvedValue(usersMockData);

      const results = await userService.getUserRecommendations('userId', {});

      expect(userRepositoryMock.getRecommendedUsersPaginated).toHaveBeenCalledWith('userId', {});
      expect(results).toEqual(expectedResults);
    });

    it('should return a list of UserViewDTO with limit Pagination options', async () => {
      const usersMockData: UserViewDTO[] = [
        {
          id: '321',
          name: '',
          username: 'username1',
          profilePicture: null,
        },
        {
          id: '123',
          name: '',
          username: 'username2',
          profilePicture: 'profilePicture2.png',
        },
      ];
      const expectedResults: UserViewDTO[] = [
        {
          id: '321',
          name: '',
          username: 'username1',
          profilePicture: null,
        },
        {
          id: '123',
          name: '',
          username: 'username2',
          profilePicture: 'profilePicture2.png',
        },
      ];

      userRepositoryMock.getRecommendedUsersPaginated.mockResolvedValue(usersMockData);

      const results = await userService.getUserRecommendations('userId', { limit: 2 });

      expect(userRepositoryMock.getRecommendedUsersPaginated).toHaveBeenCalledWith('userId', { limit: 2 });
      expect(results).toEqual(expectedResults);
    });

    it('should throw NotFoundException', async () => {
      const usersMockData: UserViewDTO[] = [];

      userRepositoryMock.getRecommendedUsersPaginated.mockResolvedValue(usersMockData);

      // const results = await userService.getUserRecommendations('userId', {});
      await expect(userService.getUserRecommendations('userId', {})).rejects.toThrow(NotFoundException);
      expect(userRepositoryMock.getRecommendedUsersPaginated).toHaveBeenCalledWith('userId', {});
      // expect(results).toEqual(expectedResults)
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userMockData: UserDTO = {
        id: '1',
        name: 'user',
        profilePicture: 'profilePicture.png',
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepositoryMock.delete.mockResolvedValue(userMockData);
      const result = await userService.deleteUser('1');

      expect(result).toEqual(userMockData);
      expect(userRepositoryMock.delete).toHaveBeenCalled();
    });

    it('should throw a RecordNotFound Exception due to incorrect userId', async () => {
      userRepositoryMock.delete.mockRejectedValue(Error());

      // should throw Prisma.ClientknownRequestError P201
      await expect(userService.deleteUser('2')).rejects.toThrow(Error());
      await expect(userService.deleteUser('2')).rejects.toBeInstanceOf(Error);
    });
  });
  describe('updateUser', () => {
    it('should update user name', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };
      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: 'newName',
        profilePicture: 'profilePicture.png',
        visibility: Visibility.PUBLIC,
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);

      const userData: UserUpdateInputDTO = { name: 'newName' };
      const result = await userService.updateUser('1', userData);
      expect(result?.name).toEqual('newName');
    });

    it('should update user password', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: 'newName',
        profilePicture: 'profilePicture.png',
        visibility: Visibility.PUBLIC,
        passwordIsUpdated: true,
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);
      // (encryptPassword as jest.Mock).mockResolvedValue('hashedNewPassword')
      mockEncryptPassword.mockResolvedValue('hashedNewPassword')

      const userData: UserUpdateInputDTO = { password: 'newPassword' };
      const result = await userService.updateUser('1', userData);
      expect(result?.passwordIsUpdated).toEqual(true);
    });

    it('should update user profilePicture', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: 'newName',
        profilePicture: 'key',
        visibility: Visibility.PUBLIC,
        passwordIsUpdated: true,
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);
      mockGeneratePreSignedUrl.mockResolvedValue({signedUrl:'preSignedUrl', key:'key'})

      const userData: UserUpdateInputDTO = { profilePicture: 'NewProfilePicture.png' };
      const result = await userService.updateUser('1', userData);
      expect(result?.profilePicture).toEqual('key');
    });

    it('should update user visibility', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: '',
        profilePicture: 'profilePicture.png',
        visibility: Visibility.PRIVATE,
        passwordIsUpdated: true,
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);

      const userData: UserUpdateInputDTO = { visibility: Visibility.PRIVATE };
      const result = await userService.updateUser('1', userData);
      expect(result?.visibility).toEqual(Visibility.PRIVATE);
    });

    it('should update user profilePicture, password, visibility, name', async () => {
      mockEncryptPassword.mockResolvedValue('hashedNewPassword')
      mockGeneratePreSignedUrl.mockResolvedValue({signedUrl:'preSignedUrl', key:'key'})
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: 'newName',
        passwordIsUpdated: true,
        visibility: Visibility.PRIVATE,
        profilePicture: 'key',
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);


      const userData: UserUpdateInputDTO = {
        name: 'newName',
        password: 'NewPassword',
        visibility: Visibility.PRIVATE,
        profilePicture: 'NewProfilePicture.png',
      };
      const result = await userService.updateUser('1', userData);
      expect(result).toEqual(updatedUserMockData);
    });

    it('should not update any kind of data', async () => {
      const userMockData: UserViewDTO = {
        id: '1',
        name: '',
        username: 'username',
        profilePicture: 'profilePicture.png',
      };

      const updatedUserMockData: UserUpdateOutputDTO = {
        id: '1',
        name: '',
        passwordIsUpdated: false,
        visibility: Visibility.PUBLIC,
        profilePicture: 'profilePicture.png',
      };

      userRepositoryMock.getById.mockResolvedValue(userMockData);
      userRepositoryMock.updateUser.mockResolvedValue(updatedUserMockData);

      const userData: UserUpdateInputDTO = {};
      const result = await userService.updateUser('1', userData);
      expect(result).toEqual(updatedUserMockData);
    });
  });

  describe('getUserContainsUsername', () => {
    it('should return all users whose username contains said name', async () => {
      const usersMockData: UserViewDTO[] = [
        {
          id: '1',
          name: '',
          username: 'username1',
          profilePicture: null,
        },
        {
          id: '2',
          name: '',
          username: 'username2',
          profilePicture: 'profilePicture2.png',
        },
        {
          id: '3',
          name: '',
          username: 'username3',
          profilePicture: 'profilePicture3.png',
        },
      ];
      userRepositoryMock.getUsersContainsUsername.mockResolvedValue(usersMockData);

      const result = await userService.getUsersContainsUsername('name');
      expect(userRepositoryMock.getUsersContainsUsername).toHaveBeenCalledWith('name');
      expect(result).toEqual(usersMockData);
    });

    it('should throw NotFoundException as 0 usernames contain said name', async () => {
      const usersMockData: UserViewDTO[] = [];
      userRepositoryMock.getUsersContainsUsername.mockResolvedValue(usersMockData);

      await expect(userService.getUsersContainsUsername('name')).rejects.toThrow(NotFoundException);
      expect(userRepositoryMock.getUsersContainsUsername).toHaveBeenCalledWith('name');
    });
  });
});
