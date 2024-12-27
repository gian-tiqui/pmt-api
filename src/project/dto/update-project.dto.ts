import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  name: string;

  @IsNotEmpty()
  status: string;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  title: string;

  @IsOptional()
  description: string;
}
