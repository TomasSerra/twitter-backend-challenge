import { CreateFollowDTO, FollowerDTO } from '@domains/follower/dto';
import { FollowerRepository } from '@domains/follower/repository/follower.repository';
import { PrismaClient } from '@prisma/client';

export class FollowerRepositoryImpl implements FollowerRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateFollowDTO): Promise<FollowerDTO> {
    const follow = await this.db.follow.create({
      data: {
        ...data,
      },
    });
    return new FollowerDTO(follow);
  }

  async delete(followId: string): Promise<void> {
    await this.db.follow.delete({
      where: {
        id: followId,
      },
    });
  }

  async getByFollowerId(followerId: string): Promise<FollowerDTO[]> {
    const follows = await this.db.follow.findMany({
      where: {
        followerId,
      },
    });
    return follows.map((follow) => new FollowerDTO(follow));
  }

  async getById(followerId: string, followedId: string): Promise<FollowerDTO | null> {
    const follow = await this.db.follow.findFirst({
      where: {
        followedId,
        followerId,
      },
    });
    return follow != null ? new FollowerDTO(follow) : null;
  }

  async getAllFollows(): Promise<FollowerDTO[]> {
    return await this.db.follow.findMany({});
  }

  async userExists(userId: string): Promise<boolean> {
    const result = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });

    return !!result;
  }
}
