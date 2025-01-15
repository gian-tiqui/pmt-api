import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import {
  CreateDepartment,
  FindDepartment,
  FindDepartments,
  FindDepartmentUser,
  FindDepartmentUsers,
  RemoveDepartment,
  UpdateDepartment,
} from 'src/types/types';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @RateLimit({
    keyPrefix: 'create-department',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before creating a department.`,
  })
  @Post()
  createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<CreateDepartment> {
    return this.departmentService.createDepartment(createDepartmentDto);
  }

  @RateLimit({
    keyPrefix: 'find-departments',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading departments.`,
  })
  @Get()
  findDepartments(@Query() query: FindAllDto): Promise<FindDepartments> {
    return this.departmentService.findDepartments(query);
  }

  @RateLimit({
    keyPrefix: 'find-department',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a department.`,
  })
  @Get(':deptId')
  findDepartment(
    @Param('deptId', ParseIntPipe) deptId: number,
  ): Promise<FindDepartment> {
    return this.departmentService.findDepartment(deptId);
  }

  @RateLimit({
    keyPrefix: 'find-department-users',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading the department's users.`,
  })
  @Get(':deptId/user')
  findDepartmentUsers(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Query() query: FindAllDto,
  ): Promise<FindDepartmentUsers> {
    return this.departmentService.findDepartmentUsers(deptId, query);
  }

  @RateLimit({
    keyPrefix: 'find-department-user',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading the department's user.`,
  })
  @Get(':deptId/user/:userId')
  findDepartmentUser(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindDepartmentUser> {
    return this.departmentService.findDepartmentUser(deptId, userId);
  }

  @RateLimit({
    keyPrefix: 'update-department',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before updating a department.`,
  })
  @Patch(':deptId')
  updateDepartment(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<UpdateDepartment> {
    return this.departmentService.updateDepartment(deptId, updateDepartmentDto);
  }

  @RateLimit({
    keyPrefix: 'delete-departments',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before deleting a department.`,
  })
  @Delete(':deptId')
  removeDepartment(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<RemoveDepartment> {
    return this.departmentService.removeDepartment(deptId, userId);
  }
}
