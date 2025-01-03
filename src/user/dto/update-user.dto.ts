import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @IsString()
  divisionId?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsInt()
  userId: number;
}
