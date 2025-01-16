import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsNotEmpty()
  userId: number;
}
