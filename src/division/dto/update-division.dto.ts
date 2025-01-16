import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDivisionDto {
  @IsString()
  @IsOptional()
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsNotEmpty()
  userId: number;
}
