// import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFollowDTO {
  constructor(followerId: string, followedId: string) {
    this.followerId = followerId;
    this.followedId = followedId;
  }

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  followedId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  followerId!: string;
}

export class FollowerDTO {
  constructor(follow: FollowerDTO) {
    this.id = follow.id;
    this.followedId = follow.followedId;
    this.followerId = follow.followerId;
    this.createdAt = follow.createdAt;
  }

  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

export class GetFollowDTO {
  constructor(follower: string, follow: string) {
    this.follower = follower;
    this.follow = follow;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  follower: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  follow: string;
}

export class DeleteFollowDTO {
  constructor(follower: string, follow: string) {
    this.follower = follower;
    this.follow = follow;
  }

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  follower: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  follow: string;
}
