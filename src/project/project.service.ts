import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { internalServerErrorMessage } from 'src/utils/messages';
import { FindAllDto } from './dto/find-all.dto';
import { getPreviousValues } from 'src/utils/functions';
import { LogMethod, PaginationDefault } from 'src/utils/enums';

const EDIT_TYPE_ID = 3;

@Injectable()
export class ProjectService {
  private logger = new Logger('ProjectService');

  constructor(private readonly prismaService: PrismaService) {}

  async createProject(createProjectDto: CreateProjectDto) {
    try {
      const newProject = await this.prismaService.project.create({
        data: {
          name: createProjectDto.name,
          title: createProjectDto.title,
          authorId: createProjectDto.authorId,
          description: createProjectDto.description,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
          status: '',
        },
      });

      return { message: 'Project created successfully.', project: newProject };
    } catch (error) {
      this.logger.error(error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findProjects(query: FindAllDto) {
    const { status, startDate, endDate, authorId, search, limit, offset } =
      query;

    try {
      const options = {
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(authorId && { authorId }),
        ...(search && {
          OR: [
            { name: { contains: search.toLowerCase() } },
            { title: { contains: search.toLowerCase() } },
            { description: { contains: search.toLowerCase() } },
          ],
        }),
      };

      const projects = await this.prismaService.project.findMany({
        where: options,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.project.count({
        where: options,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return { message: 'Projects loaded successfully.', projects, count };
    } catch (error) {
      this.logger.error('Error', error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findProject(projectId: number) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `Project with the id ${projectId} not found.`,
        );
      }

      return { message: 'Project loaded successfully.', project };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  async findProjectWorks(projectId: number, query: FindAllDto) {
    const { offset, limit, search } = query;
    try {
      const options = {
        ...(search && {
          OR: [
            { name: { contains: search.toLowerCase() } },
            { description: { contains: search.toLowerCase() } },
          ],
        }),
      };

      const works = await this.prismaService.work.findMany({
        where: {
          projectId: projectId,
          ...options,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.work.count({
        where: {
          projectId: projectId,
          ...options,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        works,
        count,
        message: 'Works of the Project loaded successfully',
      };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findProjectWork(projectId: number, workId: number) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId, projectId },
      });

      if (!work)
        throw new NotFoundException(
          `Work with the id ${workId} not found in project ${projectId}.`,
        );

      return {
        message: 'Work of the project successfully loaded.',
        work,
      };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  /*
   * 3 Levels Nesting - Might remove endpoints later.
   *
   * 3 is the maximum level of nesting and which can make the app hard to maintain.
   */

  async findProjectWorkTasks(
    projectId: number,
    workId: number,
    query: FindAllDto,
  ) {
    const { offset, limit, search, status } = query;

    try {
      const options = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search.toLowerCase() } },
            { description: { contains: search.toLowerCase() } },
          ],
        }),
      };

      const work = await this.prismaService.work.findFirst({
        where: { id: workId, projectId },
      });

      if (!work)
        throw new NotFoundException(
          `Work with the id ${workId} not found in Project with the id ${projectId}.`,
        );

      const tasks = await this.prismaService.task.findMany({
        where: {
          workId,
          ...options,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.task.count({
        where: {
          workId,
          ...options,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: `Tasks of the Project's Work loaded successfully.`,
        tasks,
        count,
      };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findProjectWorkTask(projectId: number, workId: number, taskId: number) {
    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId, workId, work: { projectId: projectId } },
      });

      if (!task)
        throw new NotFoundException(
          `Task with the id ${taskId} not found in Work with the id ${workId}.`,
        );

      return { message: 'Task loaded successfully.', task };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async updateProject(projectId: number, updateProjectDto: UpdateProjectDto) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(
          `Project with the id ${projectId} not found.`,
        );

      const user = await this.prismaService.user.findFirst({
        where: { id: +updateProjectDto.userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${projectId} not found.`);

      const userId = updateProjectDto.userId;

      delete updateProjectDto.userId;

      const updatedProject = await this.prismaService.project.update({
        where: { id: projectId },
        data: { ...updateProjectDto },
      });

      if (!updatedProject)
        throw new BadRequestException(
          'There was a problem in updating the project.',
        );

      const updatedProjectLog = await this.prismaService.log.create({
        data: {
          logMethodId: LogMethod.UPDATE,
          logTypeId: EDIT_TYPE_ID,
          editedBy: userId,
          logs: getPreviousValues(project, updateProjectDto),
        },
      });

      if (!updatedProjectLog)
        throw new BadRequestException(
          'There was a problem in creating a log for the project',
        );

      return { message: `Project updated successfully` };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async removeProject(projectId: number, userId: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found`);

      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(
          `Project with the id ${projectId} not found.`,
        );

      const deletedProject = await this.prismaService.project.delete({
        where: { id: projectId },
      });

      if (!deletedProject)
        throw new BadRequestException(
          'There was a problem in deleting the project.',
        );

      const deletedLog = await this.prismaService.log.create({
        data: {
          editedBy: userId,
          logs: project,
          logTypeId: EDIT_TYPE_ID,
          logMethodId: LogMethod.DELETE,
        },
      });

      if (!deletedLog)
        throw new BadRequestException(
          'There was a problem in creating the log.',
        );

      return { message: 'Project deleted successfully.' };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }
}
