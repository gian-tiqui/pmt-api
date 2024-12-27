import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtaskDto } from './create-subtask.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  status: string;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;
}
