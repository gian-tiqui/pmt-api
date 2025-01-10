import {
  BadRequestException,
  Inject,
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
  validateProjectDepth,
} from 'src/utils/functions';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Project, Work } from '@prisma/client';

@Injectable()
export class ProjectService {
  private logger = new Logger('ProjectService');
  private namespace: string = 'PROJECT:';
  private projectCacheKeys: string[] = [];

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

      if (this.projectCacheKeys.length > 0) {
        try {
          await Promise.all(
            this.projectCacheKeys.map((key) => this.cacheManager.del(key)),
          );

          this.projectCacheKeys = [];

          this.logger.verbose('Projects find all cache cleared.');
        } catch (error) {
          handleErrors(error, this.logger);
        }
      }

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
    const findProjectsCacheKey = `${this.namespace}${JSON.stringify(query)}`;

    try {
      let projects, count;
      const cachedProjects: { projects: Project[]; count: number } =
        await this.cacheManager.get(findProjectsCacheKey);

      if (cachedProjects) {
        this.logger.debug(`Projects cache hit.`);
        projects = cachedProjects.projects;
        count = cachedProjects.count;
      } else {
        this.logger.debug(`Projects cache missed.`);
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

        projects = await this.prismaService.project.findMany({
          where: {
            ...options,
            ...(search && {
              OR: [
                {
                  name: { contains: search.toLowerCase(), mode: 'insensitive' },
                },
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

        count = await this.prismaService.project.count({
          where: {
            ...options,
            ...(search && {
              OR: [
                {
                  name: { contains: search.toLowerCase(), mode: 'insensitive' },
                },
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

        await this.cacheManager.set(findProjectsCacheKey, { projects, count });

        this.projectCacheKeys.push(findProjectsCacheKey);
      }

      return { message: 'Projects loaded successfully.', count, projects };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProject(projectId: number) {
    try {
      let project;
      const findProjectKey = `${this.namespace}${projectId}`;
      const cachedProject = await this.cacheManager.get(findProjectKey);

      if (cachedProject) {
        this.logger.debug(`Project cache hit.`);
        project = cachedProject;
      } else {
        this.logger.debug(`Project cache missed.`);
        project = await this.prismaService.project.findFirst({
          where: { id: projectId },
          include: { author: { select: { firstName: true, lastName: true } } },
        });

        await this.cacheManager.set(findProjectKey, project);
      }

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
    const findProjectWorksCacheKey = `${this.namespace}project:${projectId}-${JSON.stringify(query)}`;

    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(`Project with the ${projectId} not found.`);

      let works, count;
      const cachedProjectWorks: { works: Work[]; count: number } =
        await this.cacheManager.get(findProjectWorksCacheKey);

      if (cachedProjectWorks) {
        this.logger.debug(`Project works cache hit.`);

        works = cachedProjectWorks.works;
        count = cachedProjectWorks.count;
      } else {
        this.logger.debug(`Project works cache missed.`);

        works = await this.prismaService.work.findMany({
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

        count = await this.prismaService.work.count({
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

        await this.cacheManager.set(findProjectWorksCacheKey, { works, count });

        this.projectCacheKeys.push(findProjectWorksCacheKey);
      }

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
    const findProjectWorkCacheKey = `${this.namespace}project-${projectId}work-${workId}`;

    try {
      let work;
      const cachedProjectWork = await this.cacheManager.get(
        findProjectWorkCacheKey,
      );

      if (cachedProjectWork) {
        this.logger.debug(`Project work cache hit.`);

        work = cachedProjectWork;
      } else {
        this.logger.debug(`Project work cache missed.`);

        work = await this.prismaService.work.findFirst({
          where: { id: workId, projectId },
          include: { author: { select: { firstName: true, lastName: true } } },
        });

        await this.cacheManager.set(findProjectWorkCacheKey, work);

        this.projectCacheKeys.push(findProjectWorkCacheKey);
      }

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

      const _project = await this.prismaService.project.findFirst({
        where: { id: projectId },
        include: {
          works: { include: { tasks: { include: { subtasks: true } } } },
          author: { select: { firstName: true, lastName: true } },
        },
      });

      const { works, ...project } = _project;

      validateProjectDepth(project, works);

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

      const updateProjectCacheKey = `${this.namespace}${projectId}`;

      await this.cacheManager.set(updateProjectCacheKey, {
        ...project,
        ...updateData,
      });

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

      const deleteProjectCacheKey = `${this.namespace}${projectId}`;

      await this.cacheManager.del(deleteProjectCacheKey);

      return { message: 'Project deleted successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
