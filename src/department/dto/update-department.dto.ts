import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  divisionId?: number;

  @IsInt()
  @IsNotEmpty()
  userId: number;
}
