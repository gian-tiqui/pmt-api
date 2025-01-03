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
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(createTaskDto);
  }

  @Get()
  findAll(@Query() query: FindAllDto) {
    return this.taskService.findTasks(query);
  }

  @Get(':workId')
  findOne(@Param('workId', ParseIntPipe) workId: number) {
    return this.taskService.findTask(workId);
  }

  @Patch(':workId')
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(workId, updateTaskDto);
  }

  @Delete(':workId')
  remove(
    @Param('workId', ParseIntPipe) workId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.taskService.removeTask(workId, userId);
  }
}
