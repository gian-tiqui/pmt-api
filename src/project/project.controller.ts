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
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllDto } from './dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import {
  CreateProject,
  FindProject,
  FindProjects,
  FindProjectWork,
  FindProjectWorks,
  RemoveProject,
  UpdateProject,
} from 'src/types/types';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
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
  createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<CreateProject> {
    return this.projectService.createProject(createProjectDto);
  }

  @RateLimit({
    keyPrefix: 'get-projects',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading the projects.',
  })
  @Get()
  findProjects(@Query('') query: FindAllDto): Promise<FindProjects> {
    return this.projectService.findProjects(query);
  }

  @RateLimit({
    keyPrefix: 'get-project',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before loading a project.',
  })
  @Get(':projectId')
  findProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<FindProject> {
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
  ): Promise<FindProjectWorks> {
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
  ): Promise<FindProjectWork> {
    return this.projectService.findProjectWork(projectId, workId);
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
  ): Promise<UpdateProject> {
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
  ): Promise<RemoveProject> {
    return this.projectService.removeProject(projectId, userId);
  }
}
