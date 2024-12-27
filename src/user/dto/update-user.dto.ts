import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  middleName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  departmentId?: number;

  @IsOptional()
  password?: string;
}
