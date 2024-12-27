import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  middleName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  departmentId: number;
}
