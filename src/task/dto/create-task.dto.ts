import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  status: string;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  workId: number;

  @IsNotEmpty()
  assignedTo: string;
}
