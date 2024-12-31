import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsInt()
  createdById: number;

  @IsNotEmpty()
  @IsInt()
  projectId: number;
}
