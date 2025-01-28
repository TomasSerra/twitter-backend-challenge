import { SignupInputDTO } from '@domains/auth/dto';

import { PrismaClient, Visibility } from '@prisma/client';
import { OffsetPagination } from '@types';
import { ExtendedUserDTO, UserDTO, UserUpdateInputDTO, UserUpdateOutputDTO, UserViewDTO } from '../dto';
import { UserRepository } from './user.repository';
import { db } from '@utils';

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: SignupInputDTO): Promise<UserDTO> {
    const user = await this.db.user.create({
      data,
    });

    return new UserDTO(user);
  }

  async getById(userId: string): Promise<UserViewDTO | null> {
    if (!userId) {
      return null;
    }

    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user === null) return null;
    return new UserViewDTO(user);
  }

  async delete(userId: string): Promise<UserDTO> {
    const deletedUser = await this.db.user.delete({
      where: {
        id: userId,
      },
    });

    return deletedUser;
  }

  async getRecommendedUsersPaginated(userId: string, options: OffsetPagination): Promise<UserViewDTO[]> {
    const followed = await this.db.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followedId: true,
      },
    });
    const followedIDs = followed.map((followed) => followed.followedId);

    const publicUsers = await this.db.user.findMany({
      where: {
        id: {
          notIn: [...followedIDs, userId],
        },
      },
      select: {
        id: true,
      },
    });
    const publicUsersIDs: string[] = publicUsers.map((publicUsersID) => publicUsersID.id);

    const recommendedUsersIDs: string[] = [...followedIDs, ...publicUsersIDs];
    if (!recommendedUsersIDs.length) return [];

    const users = await this.db.user.findMany({
      where: {
        id: { in: recommendedUsersIDs },
      },
      take: options.limit ?? undefined,
      skip: options.skip ?? undefined,
      orderBy: [
        {
          id: 'asc',
        },
      ],
    });

    return users.map((user) => new UserViewDTO(user));
  }

  async getByEmailOrUsername(email?: string, username?: string): Promise<ExtendedUserDTO | null> {
    const user = await this.db.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            username,
          },
        ],
      },
    });
    if (user === null) return null;

    return new ExtendedUserDTO(user);
  }

  async updateUser(userId: string, user: UserUpdateInputDTO): Promise<UserUpdateOutputDTO | null> {
    const updatedUser = await this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        ...user,
      },
    });
    if (updatedUser === null) return null;

    return new UserUpdateOutputDTO({
      id: updatedUser.id,
      name: updatedUser.name ?? undefined,
      profilePicture: updatedUser.profilePicture ?? undefined,
      visibility: updatedUser.visibility ?? undefined,
      passwordIsUpdated: updatedUser.password ? true : undefined,
    });
  }

  async getUsersContainsUsername(username: string): Promise<UserViewDTO[]> {
    const data = await this.db.user.findMany({
      where: {
        username: {
          contains: username,
        },
      },
    });
    return data.map((user) => new UserViewDTO(user));
  }

  async isUserPublicOrFollowed(followerID: string, followedID: string): Promise<boolean> {
    const author = await db.user.findUnique({
      where: {
        id: followedID,
      },
    });

    if (!author) return false;

    if (author.visibility === Visibility.PUBLIC) return true;

    if (author.visibility === Visibility.HIDDEN) return false;

    const follow = await db.follow.findFirst({
      where: {
        followerId: followerID,
        followedId: followedID,
      },
    });

    return follow !== null;
  }

  async isUserFollowed(followerId: string, followedId: string): Promise<boolean> {
    const otherUser = await this.db.user.findUnique({
      where: {
        id: followedId,
      },
    });

    if (otherUser === null) {
      return false;
    }

    const follow = await this.db.follow.findFirst({
      where: {
        followerId,
        followedId,
      },
    });

    return !!follow;
  }

  async checkIfUserExists(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    return !!user;
  }
}
