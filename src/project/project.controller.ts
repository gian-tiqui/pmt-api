import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    const convertedAuthorId = parseInt(String(createProjectDto.authorId), 10);

    if (isNaN(convertedAuthorId))
      throw new BadRequestException('Author id must be a number');

    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll(
    @Query('name') name: string = undefined,
    @Query('status') status: string = undefined,
    @Query('startDate') startDate: Date = undefined,
    @Query('endDate') endDate: Date = undefined,
    @Query('title') title: string = undefined,
    @Query('description') description: string = undefined,
    @Query('authorId') authorId: string = undefined,
  ) {
    const convertedAuthorId = parseInt(authorId, 10);

    if (isNaN(convertedAuthorId))
      throw new BadRequestException('Author id should be a number');

    return this.projectService.findAll(
      name,
      status,
      startDate,
      endDate,
      title,
      description,
      convertedAuthorId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const convertedId = parseInt(id, 10);

    if (isNaN(convertedId)) throw new BadRequestException('ID is not a number');

    return this.projectService.findOne(convertedId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    const convertedId = parseInt(id, 10);

    if (isNaN(convertedId)) throw new BadRequestException('ID is not a number');
    return this.projectService.update(convertedId, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    const convertedId = parseInt(id, 10);

    if (isNaN(convertedId))
      throw new BadRequestException('Project ID should be a number');

    const convertedUserId = parseInt(userId, 10);

    if (isNaN(convertedUserId))
      throw new BadRequestException('User ID should be a number');

    return this.projectService.remove(convertedId, convertedUserId);
  }
}
