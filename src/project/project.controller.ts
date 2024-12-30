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
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @RateLimit({
    keyPrefix: 'create-project',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before creating a new project.',
  })
  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @RateLimit({
    keyPrefix: 'get-projects',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the projects.',
  })
  @Get()
  findAllProjects(@Query('') query: FindAllProjectsDto) {
    return this.projectService.findAll(query);
  }

  @RateLimit({
    keyPrefix: 'get-project',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading a project.',
  })
  @Get(':projectId')
  findOneProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.findOne(projectId);
  }

  @RateLimit({
    keyPrefix: 'get-project-works',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':projectId/work/')
  findAllWorks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: FindOneWorksDto,
  ) {
    return this.projectService.findWorks(projectId, query);
  }

  @Get(':projectId/work/:workId')
  findOneWork(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('workId', ParseIntPipe) workId: number,
  ) {
    return this.projectService.findWork(projectId, workId);
  }

  @RateLimit({
    keyPrefix: 'update-project',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before updating a project.`,
  })
  @Patch(':projectId')
  updateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(projectId, updateProjectDto);
  }

  @RateLimit({
    keyPrefix: 'delete-project',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before deleting a project.`,
  })
  @Delete(':projectId')
  removeProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectService.remove(projectId, userId);
  }
}
