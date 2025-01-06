import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  userId: number;

  @IsOptional()
  @IsString()
  mentions?: string;
}
