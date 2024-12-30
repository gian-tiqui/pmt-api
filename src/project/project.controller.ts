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
import { FindAllProjectsDto } from './dto/find-all-project.dto';
import { FindOneWorksDto } from './dto/find-one-works.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAllProjects(@Query('') query: FindAllProjectsDto) {
    return this.projectService.findAll(query);
  }

  @Get(':projectId')
  findOneProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }

  @Get(':projectId/work/')
  findAllWorks(
    @Param('id', ParseIntPipe) projectId: number,
    @Query() query: FindOneWorksDto,
  ) {
    return this.projectService.findWorks(projectId, query);
  }

  @Patch(':projectId')
  updateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(projectId, updateProjectDto);
  }

  @Delete(':projectId')
  removeProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectService.remove(projectId, userId);
  }
}
