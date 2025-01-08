import { PartialType } from '@nestjs/swagger';
import { CreateDivisionDto } from './create-division.dto';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {}
