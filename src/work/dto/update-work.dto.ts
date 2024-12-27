import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkDto } from './create-work.dto';
import { IsOptional } from 'class-validator';

export class UpdateWorkDto extends PartialType(CreateWorkDto) {
  @IsOptional()
  name?: string;

  @IsOptional()
  type?: string;
}
