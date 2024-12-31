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
import { FindAllDto } from './dto/find-all.dto';
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
    return this.projectService.createProject(createProjectDto);
  }

  @RateLimit({
    keyPrefix: 'get-projects',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the projects.',
  })
  @Get()
  findProjects(@Query('') query: FindAllDto) {
    return this.projectService.findProjects(query);
  }

  @RateLimit({
    keyPrefix: 'get-project',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading a project.',
  })
  @Get(':projectId')
  findProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.findProject(projectId);
  }

  @RateLimit({
    keyPrefix: 'get-project-works',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's works.`,
  })
  @Get(':projectId/work/')
  findProjectWorks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: FindAllDto,
  ) {
    return this.projectService.findProjectWorks(projectId, query);
  }

  @RateLimit({
    keyPrefix: 'get-project-work',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's work.`,
  })
  @Get(':projectId/work/:workId')
  findProjectWork(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('workId', ParseIntPipe) workId: number,
  ) {
    return this.projectService.findProjectWork(projectId, workId);
  }

  /*
   * 3 Levels Nesting - Might remove endpoints later.
   *
   * 3 is the maximum level of nesting and which can make the app hard to maintain.
   */

  @RateLimit({
    keyPrefix: 'get-project-work-tasks',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's work tasks.`,
  })
  @Get(':projectId/work/:workId/task')
  findProjectWorkTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @Query() query: FindAllDto,
  ) {
    return this.projectService.findProjectWorkTasks(projectId, workId, query);
  }

  @RateLimit({
    keyPrefix: 'get-project-work-task',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before loading a project's work task.`,
  })
  @Get(':projectId/work/:workId/task/:taskId')
  findProjectWorkTask(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('workId', ParseIntPipe) workId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.projectService.findProjectWorkTask(projectId, workId, taskId);
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
    return this.projectService.updateProject(projectId, updateProjectDto);
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
    return this.projectService.removeProject(projectId, userId);
  }
}
