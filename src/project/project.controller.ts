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
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll(
    @Query('status') status: string = undefined,
    @Query('startDate') startDate: Date = undefined,
    @Query('endDate') endDate: Date = undefined,
    @Query('authorId', ParseIntPipe) authorId: number = undefined,
    @Query('search') search: string = '',
    @Query('offset', ParseIntPipe) offset: number = 10,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.projectService.findAll(
      status,
      startDate,
      endDate,
      authorId,
      search,
      offset,
      limit,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }

  @Get(':id/work/')
  findOneWorks(
    @Param('id', ParseIntPipe) id: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search', ParseIntPipe) search: string,
  ) {
    return this.projectService.findOneWorks(id, offset, limit, search);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectService.remove(id, userId);
  }
}
