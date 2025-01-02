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

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.createDepartment(createDepartmentDto);
  }

  @Get()
  findAll(@Query() query: FindAllDto) {
    return this.departmentService.findDepartments(query);
  }

  @Get(':deptId')
  findOne(@Param('deptId', ParseIntPipe) deptId: number) {
    return this.departmentService.findDepartment(deptId);
  }

  @Patch(':deptId')
  update(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.updateDepartment(deptId, updateDepartmentDto);
  }

  @Delete(':deptId')
  remove(
    @Param('deptId', ParseIntPipe) deptId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.departmentService.removeDepartment(deptId, userId);
  }
}
