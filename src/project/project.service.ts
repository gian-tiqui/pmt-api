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
import {
  getPreviousValues,
  handleErrors,
  firstDateGreaterThanSecondDate,
} from 'src/utils/functions';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';

@Injectable()
export class ProjectService {
  private logger = new Logger('ProjectService');

  constructor(private readonly prismaService: PrismaService) {}

  async createProject(createProjectDto: CreateProjectDto) {
    try {
      firstDateGreaterThanSecondDate(
        createProjectDto.startDate,
        createProjectDto.endDate,
        'Project',
      );

      const user = await this.prismaService.user.findFirst({
        where: { id: createProjectDto.authorId },
      });

      if (!user)
        throw new NotFoundException(
          `User with the id ${createProjectDto.authorId} not found.`,
        );

      await this.prismaService.project.create({
        data: {
          name: createProjectDto.name,
          authorId: createProjectDto.authorId,
          description: createProjectDto.description,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
        },
      });

      return { message: 'Project created successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProjects(query: FindAllDto) {
    const {
      status,
      authorId,
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
      dateWithin,
    } = query;

    try {
      const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
      const options = {
        ...(status && { status }),
        ...(dateWithin && {
          AND: [
            { startDate: { gte: dateWithin } },
            { endDate: { lte: dateWithin } },
          ],
        }),
        ...(authorId && { authorId }),
      };

      const projects = await this.prismaService.project.findMany({
        where: {
          ...options,
          ...(search && {
            OR: [
              { name: { contains: search.toLowerCase(), mode: 'insensitive' } },
              {
                description: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.project.count({
        where: {
          ...options,
          ...(search && {
            OR: [
              { name: { contains: search.toLowerCase(), mode: 'insensitive' } },
              {
                description: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },
      });

      return { message: 'Projects loaded successfully.', count, projects };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProject(projectId: number) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
        include: { author: { select: { firstName: true, lastName: true } } },
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
    const { offset, limit, search, type, sortBy, sortOrder, dateWithin } =
      query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(`Project with the ${projectId} not found.`);

      const works = await this.prismaService.work.findMany({
        where: {
          projectId,
          ...(type && { type: { mode: 'insensitive', equals: type } }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
        orderBy,
      });

      const count = await this.prismaService.work.count({
        where: {
          projectId,
          ...(type && { type: { mode: 'insensitive', equals: type } }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
        },
      });

      return {
        message: 'Works of the Project loaded successfully',
        count,
        works,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProjectWork(projectId: number, workId: number) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId, projectId },
        include: { author: { select: { firstName: true, lastName: true } } },
      });

      if (!work)
        throw new NotFoundException(
          `Work with the id ${workId} not found in project ${projectId}.`,
        );

      return {
        message: 'Work of the project loaded successfully.',
        work,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateProject(projectId: number, updateProjectDto: UpdateProjectDto) {
    try {
      const { userId, ...updateData } = updateProjectDto;

      firstDateGreaterThanSecondDate(
        updateData.startDate,
        updateData.endDate,
        'Project',
      );

      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(
          `Project with the id ${projectId} not found.`,
        );

      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${projectId} not found.`);

      const updatedProject = await this.prismaService.project.update({
        where: { id: projectId },
        data: { ...updateData },
      });

      if (!updatedProject)
        throw new BadRequestException(
          'There was a problem in updating the project.',
        );

      const updatedProjectLog = await this.prismaService.log.create({
        data: {
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.PROJECT,
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

      const deletedProjectLog = await this.prismaService.log.create({
        data: {
          editedBy: userId,
          logs: project,
          logTypeId: LogType.PROJECT,
          logMethodId: LogMethod.DELETE,
        },
      });

      if (!deletedProjectLog)
        throw new BadRequestException(
          'There was a problem in creating the log.',
        );

      return { message: 'Project deleted successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
