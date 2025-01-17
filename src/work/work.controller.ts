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
  UseGuards,
} from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import {
  CreateWork,
  FindWork,
  FindWorks,
  FindWorkTask,
  FindWorkTasks,
  RemoveWork,
  UpdateWork,
} from 'src/types/types';

@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @RateLimit({
    keyPrefix: 'create-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before creating a new work.`,
  })
  @Post()
  createWork(@Body() createWorkDto: CreateWorkDto): Promise<CreateWork> {
    return this.workService.createWork(createWorkDto);
  }

  @RateLimit({
    keyPrefix: 'get-works',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading works`,
  })
  @Get()
  findWorks(@Query() query: FindAllDto): Promise<FindWorks> {
    return this.workService.findWorks(query);
  }

  @RateLimit({
    keyPrefix: 'get-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a work.`,
  })
  @Get(':workId')
  findWork(@Param('workId', ParseIntPipe) workId: number): Promise<FindWork> {
    return this.workService.findWork(workId);
  }

  @RateLimit({
    keyPrefix: 'get-work-tasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a work's tasks.`,
  })
  @Get(':workId/task')
  findWorkTasks(
    @Param('workId') workId: number,
    @Query() query: FindAllDto,
  ): Promise<FindWorkTasks> {
    return this.workService.findWorkTasks(workId, query);
  }

  @RateLimit({
    keyPrefix: 'get-work-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a work's task.`,
  })
  @Get(':workId/task/:taskId')
  findWorkTask(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<FindWorkTask> {
    return this.workService.findWorkTask(workId, taskId);
  }

  @RateLimit({
    keyPrefix: 'update-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before updating a work.`,
  })
  @Patch(':workId')
  updateWork(
    @Param('workId', ParseIntPipe) workId: number,
    @Body() updateWorkDto: UpdateWorkDto,
  ): Promise<UpdateWork> {
    return this.workService.updateWork(workId, updateWorkDto);
  }

  @RateLimit({
    keyPrefix: 'delete-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before deleting a work.`,
  })
  @Delete(':workId')
  removeWork(
    @Param('workId', ParseIntPipe) workId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<RemoveWork> {
    return this.workService.removeWork(workId, userId);
  }
}
