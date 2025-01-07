import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsNotEmpty()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  mentions?: string;

  @IsOptional()
  @IsInt()
  taskId?: number;
}
