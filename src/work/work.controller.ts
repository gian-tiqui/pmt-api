import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';

@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Post()
  createWork(@Body() createWorkDto: CreateWorkDto) {
    return this.workService.createWork(createWorkDto);
  }

  @Get()
  findWorks() {
    return this.workService.findWorks();
  }

  @Get(':workId')
  findWork(@Param('workId', ParseIntPipe) workId: number) {
    return this.workService.findWork(workId);
  }

  @Patch(':workId')
  updateWork(
    @Param('workId', ParseIntPipe) workId: number,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    return this.workService.updateWork(workId, updateWorkDto);
  }

  @Delete(':workId')
  removeWork(@Param('workId', ParseIntPipe) workId: number) {
    return this.workService.removeWork(workId);
  }
}
