import { SignupInputDTO } from '@domains/auth/dto';
import { OffsetPagination } from '@types';
import { ExtendedUserDTO, UserDTO, UserUpdateInputDTO, UserUpdateOutputDTO, UserViewDTO } from '../dto';

export interface UserRepository {
  create: (data: SignupInputDTO) => Promise<UserDTO>;
  delete: (userId: string) => Promise<UserDTO>;
  getRecommendedUsersPaginated: (userId: string, options: OffsetPagination) => Promise<UserViewDTO[]>;
  getById: (userId: string) => Promise<UserViewDTO | null>;
  getByEmailOrUsername: (email?: string, username?: string) => Promise<ExtendedUserDTO | null>;
  updateUser: (userId: string, user: UserUpdateInputDTO) => Promise<UserUpdateOutputDTO | null>;

  getUsersContainsUsername: (username: string) => Promise<UserViewDTO[]>;

  isUserPublicOrFollowed: (followerID: string, followedID: string) => Promise<boolean>;
  isUserFollowed: (followerID: string, followedID: string) => Promise<boolean>;
  checkIfUserExists: (userId: string) => Promise<boolean>;
}
