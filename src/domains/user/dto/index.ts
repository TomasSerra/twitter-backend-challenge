import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Visibility } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UserDTO {
  constructor(user: UserDTO) {
    this.id = user.id;
    this.name = user.name;
    this.visibility = user.visibility;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.profilePicture = user.profilePicture;
  }

  id: string;
  name: string | null;
  visibility: Visibility | null;
  profilePicture: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export class UserUpdateInputDTO {
  constructor(name?: string, password?: string, visibility?: Visibility, profilePicture?: string) {
    this.name = name;
    this.password = password;
    this.visibility = visibility;
    this.profilePicture = profilePicture;
  }

  @IsOptional()
  @IsEnum(Visibility)
  @Transform(({ value }) => Visibility[value as keyof typeof Visibility])
  readonly visibility?: Visibility = 'PUBLIC';

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class UserUpdateOutputDTO {
  constructor(user: UserUpdateOutputDTO) {
    this.id = user.id;
    this.name = user.name;
    this.profilePicture = user.profilePicture;
    this.visibility = user.visibility;
    this.passwordIsUpdated = user.passwordIsUpdated;
  }

  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  passwordIsUpdated?: boolean = false;
}

export class ExtendedUserDTO extends UserDTO {
  constructor(user: ExtendedUserDTO) {
    super(user);
    this.email = user.email;
    this.name = user.name;
    this.password = user.password;
  }

  email!: string;
  username!: string;
  password!: string;
}

export class UserViewDTO {
  constructor(user: UserViewDTO) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.profilePicture = user.profilePicture;
    this.visibility = user.visibility;
  }

  id: string;
  name: string | null;
  username: string;
  profilePicture: string | null;
  visibility: Visibility;
}
