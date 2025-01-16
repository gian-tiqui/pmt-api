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
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @RateLimit({
    keyPrefix: 'create-division',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before creating a new division.',
  })
  @Post()
  createDivision(
    @Body() createDivisionDto: CreateDivisionDto,
  ): Promise<CreateDivision> {
    return this.divisionService.createDivision(createDivisionDto);
  }

  @RateLimit({
    keyPrefix: 'find-divisions',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the divisions.',
  })
  @Get()
  findAllDivisions(@Query() query: FindAllDto): Promise<FindDivisions> {
    return this.divisionService.findDivisions(query);
  }

  @RateLimit({
    keyPrefix: 'find-division',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading a division.',
  })
  @Get(':divisionId')
  findDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
  ): Promise<FindDivision> {
    return this.divisionService.findDivision(divisionId);
  }

  @RateLimit({
    keyPrefix: 'find-division-users',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the users of the division.',
  })
  @Get(':divisionId/user')
  findDivisionUsers(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query() query: FindAllDto,
  ): Promise<FindDivisionUsers> {
    return this.divisionService.findDivisionUsers(divisionId, query);
  }

  @RateLimit({
    keyPrefix: 'find-division-user',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the user of the division.',
  })
  @Get(':divisionId/user/:userId')
  findDivisionUser(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindDivisionUser> {
    return this.divisionService.findDivisionUser(divisionId, userId);
  }

  @RateLimit({
    keyPrefix: 'find-division-departments',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the departments of the division.',
  })
  @Get(':divisionId/department')
  findDivisionDepartments(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query() query: FindAllDto,
  ): Promise<FindDivisionDepartments> {
    return this.divisionService.findDivisionDepartments(divisionId, query);
  }

  @RateLimit({
    keyPrefix: 'find-division-department',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the department of a division.',
  })
  @Get(':divisionId/user/:deptId')
  findDivisionDepartment(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Param('deptId', ParseIntPipe) deptId: number,
  ): Promise<FindDivisionDepartment> {
    return this.divisionService.findDivisionDepartment(divisionId, deptId);
  }

  @RateLimit({
    keyPrefix: 'update-division',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before updating the division.',
  })
  @Patch(':divisionId')
  updateDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Body() updateDivisionDto: UpdateDivisionDto,
  ): Promise<UpdateDivision> {
    return this.divisionService.updateDivision(divisionId, updateDivisionDto);
  }

  @RateLimit({
    keyPrefix: 'remove-division',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before deleting the divison.',
  })
  @Delete(':divisionId')
  removeDivision(
    @Param('divisionId', ParseIntPipe) divisionId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<RemoveDivision> {
    return this.divisionService.removeDivision(divisionId, userId);
  }
}
