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
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @RateLimit({
    keyPrefix: 'create-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(createTaskDto);
  }

  @RateLimit({
    keyPrefix: 'find-tasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get()
  findTasks(@Query() query: FindAllDto) {
    return this.taskService.findTasks(query);
  }

  @RateLimit({
    keyPrefix: 'get-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId')
  findTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskService.findTask(taskId);
  }

  @RateLimit({
    keyPrefix: 'get-task-subtasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId/subtask')
  findTaskSubtasks(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query() query: FindAllDto,
  ) {
    return this.taskService.findTaskSubtasks(taskId, query);
  }

  @RateLimit({
    keyPrefix: 'get-task-subtask',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId/subtask/:subTaskId')
  findTaskSubtask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('subTaskId', ParseIntPipe) subTaskId: number,
  ) {
    return this.taskService.findTaskSubtask(taskId, subTaskId);
  }

  @RateLimit({
    keyPrefix: 'get-task-comments',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId/comment/')
  findTaskComments(
    @Param('taskId', ParseIntPipe) taskId,
    @Query() query: FindAllDto,
  ) {
    return this.taskService.findTaskComments(taskId, query);
  }

  @RateLimit({
    keyPrefix: 'get-task-comment',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId/comment/:commentId')
  findTaskComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.taskService.findTaskComment(taskId, commentId);
  }

  @RateLimit({
    keyPrefix: 'update-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Patch(':taskId')
  updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(taskId, updateTaskDto);
  }

  @RateLimit({
    keyPrefix: 'delete-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Delete(':taskId')
  removeTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.taskService.removeTask(taskId, userId);
  }
}
