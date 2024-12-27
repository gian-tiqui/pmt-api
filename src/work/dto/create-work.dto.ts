import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWorkDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  type: string;

  @IsOptional()
  description: string;

  @IsOptional()
  createdById: number;

  @IsNotEmpty()
  projectId: number;
}
