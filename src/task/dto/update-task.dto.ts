import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsInt()
  workId: number;

  @IsOptional()
  @IsInt()
  assignedToId: number;

  @IsOptional()
  @IsInt()
  parentId: number;

  @IsNotEmpty()
  @IsInt()
  userId: number;
}
