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
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';

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
  createWork(@Body() createWorkDto: CreateWorkDto) {
    return this.workService.createWork(createWorkDto);
  }

  @RateLimit({
    keyPrefix: 'get-works',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading works`,
  })
  @Get()
  findWorks(@Query() query: FindAllDto) {
    return this.workService.findWorks(query);
  }

  @RateLimit({
    keyPrefix: 'get-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a work.`,
  })
  @Get(':workId')
  findWork(@Param('workId', ParseIntPipe) workId: number) {
    return this.workService.findWork(workId);
  }

  @RateLimit({
    keyPrefix: 'get-work-tasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a work's tasks.`,
  })
  findWorkTasks(@Query() query) {
    return this.workService.findWorkTasks(query);
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
  ) {
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
  ) {
    return this.workService.removeWork(workId, userId);
  }
}
