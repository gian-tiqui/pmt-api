import { IsInt, IsJSON, IsNotEmpty } from 'class-validator';

export class CreateLogDto {
  @IsNotEmpty()
  @IsInt()
  editedBy: number;

  @IsNotEmpty()
  @IsInt()
  logTypeId: number;

  @IsNotEmpty()
  @IsInt()
  logMethodId: number;

  @IsNotEmpty()
  @IsJSON()
  logs: object;
}
