import { OffsetPagination } from '@types';
import { UserDTO, UserUpdateInputDTO, UserUpdateOutputDTO, UserViewDTO } from '../dto';

export interface UserService {
  deleteUser: (userId: string) => Promise<UserDTO>;
  getUser: (userId: string) => Promise<UserViewDTO>;
  getUserRecommendations: (userId: string, options: OffsetPagination) => Promise<UserViewDTO[]>;
  updateUser: (userId: string, user: UserUpdateInputDTO) => Promise<UserUpdateOutputDTO | null>;
  getUsersContainsUsername: (username: string) => Promise<UserViewDTO[]>;

  isUserPublic: (userId: string) => Promise<boolean>;
  isUserFollowed: (followerID: string, followedID: string) => Promise<boolean>;
  checkIfUserExists: (userId: string) => Promise<boolean>;
}
