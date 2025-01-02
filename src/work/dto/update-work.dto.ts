import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsInt()
  editedBy: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
