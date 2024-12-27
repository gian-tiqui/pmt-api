import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  message: string;

  @IsNotEmpty()
  userId: number;

  @IsOptional()
  mentions: string[];
}
