import { IsInt, IsJSON, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateLogDto {
  @IsNotEmpty()
  @IsInt()
  editedBy: number;

  @IsOptional()
  @IsInt()
  logTypeId: number;

  @IsOptional()
  @IsInt()
  logMethodId: number;

  @IsOptional()
  @IsJSON()
  logs: object;
}
