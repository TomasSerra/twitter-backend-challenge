import { UserRepositoryImpl } from '@domains/user/repository';
import { validate } from 'class-validator';
import { db } from '@utils/database';
import {
  checkPassword,
  ConflictException,
  encryptPassword,
  generateAccessToken,
  NotFoundException,
  UnauthorizedException,
} from '@utils';
import { LoginInputDTO, SignupInputDTO, TokenDTO } from '@domains/auth/dto';
import { AuthService, AuthServiceImpl } from '@domains/auth/service';
import { Visibility } from '@prisma/client';
import { ExtendedUserDTO } from '@domains/user/dto';

jest.mock('src/domains/user/repository/user.repository.impl');
jest.mock('class-validator');
jest.mock('src/utils/auth');

describe('Auth Service Impl', () => {
  let authService: AuthService;
  let userRepositoryMock: jest.Mocked<UserRepositoryImpl>;

  beforeEach(() => {
    userRepositoryMock = new UserRepositoryImpl(db) as jest.Mocked<UserRepositoryImpl>;
    authService = new AuthServiceImpl(userRepositoryMock);
  });

  describe('signup', () => {
    it('should be able to create a user', async () => {
      userRepositoryMock.getByEmailOrUsername.mockResolvedValue(null);
      (validate as jest.Mock).mockResolvedValue([]);
      (encryptPassword as jest.Mock).mockResolvedValue('encrypted-password');
      (generateAccessToken as jest.Mock).mockReturnValue('test-token');
      userRepositoryMock.create.mockResolvedValue({
        id: '1',
        name: 'franco',
        visibility: Visibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicture: 'profilePicture.png',
      });

      const signupData: SignupInputDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };

      const result: TokenDTO = await authService.signup(signupData);
      expect(result).toEqual({ token: 'test-token' });
      expect(encryptPassword).toHaveBeenLastCalledWith('password');
      expect(userRepositoryMock.create).toHaveBeenCalledWith({ ...signupData, password: 'encrypted-password' });
      expect(generateAccessToken).toHaveBeenCalledWith({ userId: '1' });
    });

    it('should throw ConflictException if user already exists ', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
        name: 'user',
        visibility: Visibility.PUBLIC,
        profilePicture: 'profilePicture.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepositoryMock.getByEmailOrUsername.mockResolvedValue(userData);

      const signupData: SignupInputDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };

      await expect(authService.signup(signupData)).rejects.toThrow(ConflictException);
      expect(userRepositoryMock.getByEmailOrUsername(signupData.email, signupData.username));
      expect(userData.email).toEqual(signupData.email);
      expect(userData.username).toEqual(signupData.username);
      expect(userData.password).toEqual(signupData.password);
    });
  });

  describe('login', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      userRepositoryMock.getByEmailOrUsername.mockResolvedValue(null);

      const signupData: SignupInputDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };

      await expect(authService.login(signupData)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const userMockData: ExtendedUserDTO = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        name: 'user',
        visibility: Visibility.PUBLIC,
        profilePicture: 'profilePicture.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepositoryMock.getByEmailOrUsername.mockResolvedValue(userMockData);

      const loginInputDTO: LoginInputDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'bad password',
      };

      await expect(authService.login(loginInputDTO)).rejects.toThrow(UnauthorizedException);
    });

    it('should return a successful login token', async () => {
      const userMockData: ExtendedUserDTO = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password',
        name: 'user',
        visibility: Visibility.PUBLIC,
        profilePicture: 'profilePicture.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepositoryMock.getByEmailOrUsername.mockResolvedValue(userMockData);
      (checkPassword as jest.Mock).mockResolvedValue(true);

      const loginInputDTO: LoginInputDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password',
      };

      (generateAccessToken as jest.Mock).mockReturnValue('token');

      const result = await authService.login(loginInputDTO);
      expect(result).toEqual({ token: 'token' });
    });
  });
});
