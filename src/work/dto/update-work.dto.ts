import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkDto } from './create-work.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkDto extends PartialType(CreateWorkDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
