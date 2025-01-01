import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from './dto/find-all.dto';
import { getPreviousValues, handleErrors } from 'src/utils/functions';
import { LogMethod, PaginationDefault, Status } from 'src/utils/enums';

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
          authorId: createProjectDto.authorId,
          description: createProjectDto.description,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
          status: Status.PENDING,
        },
      });

      return { message: 'Project created successfully.', project: newProject };
    } catch (error) {
      handleErrors(error, this.logger);
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
      handleErrors(error, this.logger);
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
      handleErrors(error, this.logger);
    }
  }

  async findProjectWorks(projectId: number, query: FindAllDto) {
    const { offset, limit, search, type } = query;
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
          type,
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
      handleErrors(error, this.logger);
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
      handleErrors(error, this.logger);
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
      handleErrors(error, this.logger);
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
      handleErrors(error, this.logger);
    }
  }
}
