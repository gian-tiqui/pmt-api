import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { DivisionService } from './division.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import {
  CreateDivision,
  FindDivision,
  FindDivisionDepartment,
  FindDivisionDepartments,
  FindDivisions,
  FindDivisionUser,
  FindDivisionUsers,
  RemoveDivision,
  UpdateDivision,
} from 'src/types/types';

@Controller('division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Post()
  createDivision(
    @Body() createDivisionDto: CreateDivisionDto,
  ): Promise<CreateDivision> {
    return this.divisionService.createDivision(createDivisionDto);
  }

  @Get()
  findAllDivisions(@Query() query: FindAllDto): Promise<FindDivisions> {
    return this.divisionService.findDivisions(query);
  }

  @Get(':divisionId')
  findDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
  ): Promise<FindDivision> {
    return this.divisionService.findDivision(divisionId);
  }

  @Get(':divisionId/user')
  findDivisionUsers(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query() query: FindAllDto,
  ): Promise<FindDivisionUsers> {}

  @Get(':divisionId/user/:userId')
  findDivisionUser(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindDivisionUser> {}

  @Get(':divisionId/department')
  findDivisionDepartments(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query() query: FindAllDto,
  ): Promise<FindDivisionDepartments> {}

  @Get(':divisionId/user/:userId')
  findDivisionDepartment(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindDivisionDepartment> {}

  @Patch(':divisionId')
  updateDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Body() updateDivisionDto: UpdateDivisionDto,
  ): Promise<UpdateDivision> {
    return this.divisionService.updateDivision(divisionId, updateDivisionDto);
  }

  @Delete(':divisionId')
  removeDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<RemoveDivision> {
    return this.divisionService.removeDivision(divisionId, userId);
  }
}
