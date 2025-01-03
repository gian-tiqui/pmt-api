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
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(createTaskDto);
  }

  @Get()
  findTasks(@Query() query: FindAllDto) {
    return this.taskService.findTasks(query);
  }

  @Get(':taskId')
  findTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskService.findTask(taskId);
  }

  @Get(':taskId/subtasks')
  findTaskSubtasks(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query() query: FindAllDto,
  ) {
    return this.taskService.findTaskSubtasks(taskId, query);
  }

  @Get(':taskId/subtasks/:subTaskId')
  findTaskSubtask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('subTaskId', ParseIntPipe) subTaskId: number,
  ) {
    return this.taskService.findTaskSubtask(taskId, subTaskId);
  }

  @Patch(':taskId')
  updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(taskId, updateTaskDto);
  }

  @Delete(':taskId')
  removeTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.taskService.removeTask(taskId, userId);
  }
}
