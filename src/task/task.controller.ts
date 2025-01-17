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
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import {
  CreateTask,
  FindTask,
  FindTaskComment,
  FindTaskComments,
  FindTasks,
  FindTaskSubtask,
  FindTaskSubtasks,
  FindTaskUser,
  FindTaskUsers,
  RemoveTask,
  UpdateTask,
} from 'src/types/types';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
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
  createTask(@Body() createTaskDto: CreateTaskDto): Promise<CreateTask> {
    return this.taskService.createTask(createTaskDto);
  }

  @RateLimit({
    keyPrefix: 'find-tasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get()
  findTasks(@Query() query: FindAllDto): Promise<FindTasks> {
    return this.taskService.findTasks(query);
  }

  @RateLimit({
    keyPrefix: 'get-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId')
  findTask(@Param('taskId', ParseIntPipe) taskId: number): Promise<FindTask> {
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
  ): Promise<FindTaskSubtasks> {
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
  ): Promise<FindTaskSubtask> {
    return this.taskService.findTaskSubtask(taskId, subTaskId);
  }

  @RateLimit({
    keyPrefix: 'get-task-users',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':taskId/user')
  findTaskUsers(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query() query: FindAllDto,
  ): Promise<FindTaskUsers> {
    return this.taskService.findTaskUsers(taskId, query);
  }

  @RateLimit({
    keyPrefix: 'get-task-user',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a task's user.`,
  })
  @Get(':taskId/user/:userId')
  findTaskUser(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindTaskUser> {
    return this.taskService.findTaskUser(taskId, userId);
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
  ): Promise<FindTaskComments> {
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
  ): Promise<FindTaskComment> {
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
  ): Promise<UpdateTask> {
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
  ): Promise<RemoveTask> {
    return this.taskService.removeTask(taskId, userId);
  }
}
