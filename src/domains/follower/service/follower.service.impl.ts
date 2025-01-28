import { FollowerService } from '@domains/follower/service/follower.service';
import { CreateFollowDTO, DeleteFollowDTO, FollowerDTO, GetFollowDTO } from '@domains/follower/dto';
import { validate } from 'class-validator';
import { ConflictException, NotFoundException, ValidationException } from '@utils';
import { FollowerRepository } from '@domains/follower/repository';

export class FollowerServiceImpl implements FollowerService {
  constructor(private readonly repository: FollowerRepository) {}

  /* TODO no se siga a si mismo (DONE).
  // TODO no lo cree si ya existe (DONE)
  // TODO no cree si el seguido no existe (DONE)
  */
  async createFollower(followerId: string, followedId: string): Promise<FollowerDTO> {
    const data = new CreateFollowDTO(followerId, followedId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    if (followerId === followedId) throw new ConflictException('cannot follow itself');

    const followedExist: boolean = await this.repository.userExists(followedId);
    if (!followedExist) throw new NotFoundException('followed does not exists');

    const oldFollow = await this.repository.getById(followerId, followedId);
    if (oldFollow) throw new ConflictException('follow already exist');

    return await this.repository.create(data);
  }

  async deleteFollower(followerId: string, followedId: string): Promise<void> {
    const data = new DeleteFollowDTO(followerId, followedId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const follow = await this.repository.getById(followerId, followedId);
    if (!follow) throw new NotFoundException('follow');
    await this.repository.delete(follow.id);
  }

  async getFollow(followerId: string, followId: string): Promise<FollowerDTO> {
    const data = new GetFollowDTO(followerId, followId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const follow = await this.repository.getById(followerId, followId);
    if (!follow) throw new NotFoundException('follow');
    return follow;
  }

  async getAllFollows(): Promise<FollowerDTO[]> {
    const follows = await this.repository.getAllFollows();
    if (!follows.length) throw new NotFoundException('follows');

    return follows;
  }
}
