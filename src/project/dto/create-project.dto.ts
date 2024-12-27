import { IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  authorId: number;
}
