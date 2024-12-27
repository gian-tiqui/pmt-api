import { IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  description: string;
}
