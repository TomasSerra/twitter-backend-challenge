import {
  CreateReactionDTO,
  DeleteReactionDTO,
  GetReactionDTO,
  GetReactionsFromPostDTO,
  GetReactionsFromUserDTO,
  ReactionDTO,
} from '@domains/reaction/dto';
import { ReactionRepository } from '@domains/reaction/repository';
import { ReactionService } from '@domains/reaction/service/reaction.service';
import { ConflictException, ForbiddenException, NotFoundException, ValidationException } from '@utils';
import { validate } from 'class-validator';
import { UserRepository } from '@domains/user/repository';

export class ReactionServiceImpl implements ReactionService {
  constructor(
    private readonly repository: ReactionRepository,
    private readonly userValidationRepository: UserRepository
  ) {}

  async createReaction(data: CreateReactionDTO): Promise<ReactionDTO> {
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    if (!(await this.repository.postExists(data.postId))) throw new NotFoundException('post not found');

    if (!(await this.repository.userExists(data.userId))) throw new NotFoundException('user not found');

    if (await this.repository.checkReactionExists(data.userId, data.postId, data.action))
      throw new ConflictException('reaction already Exists');

    return await this.repository.create(data);
  }

  async deleteReaction(data: DeleteReactionDTO): Promise<void> {
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    if (!(await this.repository.postExists(data.postId))) throw new NotFoundException('post not found');

    if (!(await this.repository.userExists(data.userId))) throw new NotFoundException('user not found');

    if (!(await this.repository.checkReactionExists(data.userId, data.postId, data.action)))
      throw new ConflictException('reaction does not Exists');

    await this.repository.delete(data.userId, data.postId, data.action);
  }

  async getAllReactions(): Promise<ReactionDTO[]> {
    const reactions = await this.repository.getAllReactions();
    if (!reactions.length) throw new NotFoundException('reactions');
    return reactions;
  }

  async getReaction(reactionId: string): Promise<ReactionDTO> {
    const data = new GetReactionDTO(reactionId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const reaction = await this.repository.getByReactionId(data.reactionId);
    if (!reaction) throw new NotFoundException('reaction');
    return reaction;
  }

  async getReactionsFromUser(userId: string, authorId: string): Promise<ReactionDTO[]> {
    const data = new GetReactionsFromUserDTO(userId, authorId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    const result = await this.userValidationRepository.isUserPublicOrFollowed(data.userId, data.authorId);
    if (!result) throw new ForbiddenException();

    const reactions = await this.repository.getAllReactionsFromUser(data.authorId);
    if (!reactions.length) throw new NotFoundException('reactions');

    return reactions;
  }

  async getReactionsFromPost(userId: string, postId: string): Promise<ReactionDTO[]> {
    const data = new GetReactionsFromPostDTO(userId, postId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }

    const authorId = await this.repository.getAuthorIdOfPost(postId);
    if (!authorId) throw new NotFoundException('authorId');

    const reactions = await this.repository.getAllReactionsFromPost(postId);
    if (!reactions.length) throw new NotFoundException('reactions');

    return reactions;
  }

  async getAllLikesFromUser(userId: string, authorId: string): Promise<ReactionDTO[]> {
    const data = new GetReactionsFromUserDTO(userId, authorId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    const result = await this.userValidationRepository.isUserPublicOrFollowed(data.userId, data.authorId);
    if (!result) throw new ForbiddenException();

    const reactions = await this.repository.getAllLikesFromUser(data.authorId);
    if (!reactions.length) throw new NotFoundException('reactions');

    return reactions;
  }

  async getAllRetweetsFromUser(userId: string, authorId: string): Promise<ReactionDTO[]> {
    const data = new GetReactionsFromUserDTO(userId, authorId);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new ValidationException(errors.map((error) => ({ ...error, target: undefined, value: undefined })));
    }
    const result = await this.userValidationRepository.isUserPublicOrFollowed(data.userId, data.authorId);
    if (!result) throw new ForbiddenException();

    const reactions = await this.repository.getAllRetweetsFromUser(data.authorId);
    if (!reactions.length) throw new NotFoundException('reactions');

    return reactions;
  }
}
