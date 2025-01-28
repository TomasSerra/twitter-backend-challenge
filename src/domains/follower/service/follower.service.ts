import { FollowerDTO } from '@domains/follower/dto';

export interface FollowerService {
  createFollower: (followerId: string, followedId: string) => Promise<FollowerDTO>;
  deleteFollower: (followerId: string, followId: string) => Promise<void>;
  getFollow: (followerId: string, followId: string) => Promise<FollowerDTO>;

  getAllFollows: () => Promise<FollowerDTO[]>;
}
