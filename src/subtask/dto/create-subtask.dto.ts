import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubtaskDto {
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  status: string;

  @IsOptional()
  description: string;

  @IsOptional()
  title: string;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  taskId: number;
}
