import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  mentions?: string;

  @IsNotEmpty()
  @IsInt()
  taskId: number;
}
