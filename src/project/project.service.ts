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
  generateCacheKey,
  clearKeys,
} from 'src/utils/functions';
import {
  Identifier,
  LogMethod,
  LogType,
  Namespace,
  PaginationDefault,
} from 'src/utils/enums';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Project, User, Work } from '@prisma/client';
import {
  CreateProject,
  FindProject,
  FindProjects,
  FindProjectWork,
  FindProjectWorks,
  RemoveProject,
  UpdateProject,
} from 'src/types/types';

@Injectable()
export class ProjectService {
  private logger: Logger = new Logger('ProjectService');
  private namespace: string = 'PROJECT:';
  private projectCacheKeys: Set<string> = new Set<string>();

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createProject(
    createProjectDto: CreateProjectDto,
  ): Promise<CreateProject> {
    try {
      firstDateGreaterThanSecondDate(
        createProjectDto.startDate,
        createProjectDto.endDate,
        'Project',
      );

      const user: User = await this.prismaService.user.findFirst({
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

      clearKeys(
        this.projectCacheKeys,
        this.cacheManager,
        this.logger,
        'Projects',
      );

      return { message: 'Project created successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProjects(query: FindAllDto): Promise<FindProjects> {
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
    const findProjectsCacheKey: string = generateCacheKey(
      this.namespace,
      'findProjects',
      query,
    );

    try {
      let projects: Project[], count: number;
      const cachedProjects: { projects: Project[]; count: number } =
        await this.cacheManager.get(findProjectsCacheKey);

      if (cachedProjects) {
        this.logger.debug(`Projects cache hit.`);

        projects = cachedProjects.projects;
        count = cachedProjects.count;
      } else {
        this.logger.debug(`Projects cache missed.`);

        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
        const where: object = {
          ...(status && { status }),
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
          ...(authorId && { authorId }),
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
        };

        projects = await this.prismaService.project.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.project.count({
          where,
        });

        await this.cacheManager.set(findProjectsCacheKey, { projects, count });

        this.projectCacheKeys.add(findProjectsCacheKey);
      }

      return { message: 'Projects loaded successfully.', count, projects };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProject(projectId: number): Promise<FindProject> {
    try {
      let project: Project;
      const findProjectKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.PROJECT,
        {
          projectId,
        },
      );

      const cachedProject: Project =
        await this.cacheManager.get(findProjectKey);

      if (cachedProject) {
        this.logger.debug(`Project cache hit.`);

        project = cachedProject;
      } else {
        this.logger.debug(`Project cache missed.`);

        project = await this.prismaService.project.findFirst({
          where: { id: projectId },
          include: { author: { select: { firstName: true, lastName: true } } },
        });

        if (!project) {
          throw new NotFoundException(
            `Project with the id ${projectId} not found.`,
          );
        }

        await this.cacheManager.set(findProjectKey, project);
      }

      return { message: 'Project loaded successfully.', project };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findProjectWorks(
    projectId: number,
    query: FindAllDto,
  ): Promise<FindProjectWorks> {
    const { offset, limit, search, type, sortBy, sortOrder, dateWithin } =
      query;
    const orderBy: object = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : undefined;

    try {
      const project = await this.prismaService.project.findFirst({
        where: { id: projectId },
      });

      if (!project)
        throw new NotFoundException(`Project with the ${projectId} not found.`);

      let works: Work[], count: number;
      const findProjectWorksCacheKey: string = generateCacheKey(
        this.namespace,
        'findProjectWorks',
        { ...query, projectId },
      );
      const cachedProjectWorks: { works: Work[]; count: number } =
        await this.cacheManager.get(findProjectWorksCacheKey);

      if (cachedProjectWorks) {
        this.logger.debug(`Project works cache hit.`);

        works = cachedProjectWorks.works;
        count = cachedProjectWorks.count;
      } else {
        this.logger.debug(`Project works cache missed.`);

        const where: object = {
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
        };

        works = await this.prismaService.work.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.work.count({
          where,
        });

        await this.cacheManager.set(findProjectWorksCacheKey, { works, count });

        this.projectCacheKeys.add(findProjectWorksCacheKey);
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

  async findProjectWork(
    projectId: number,
    workId: number,
  ): Promise<FindProjectWork> {
    const findProjectWorkCacheKey = generateCacheKey(
      Namespace.GENERAL,
      Identifier.WORK,
      { workId },
    );

    try {
      let work: Work;
      const cachedProjectWork: Work = await this.cacheManager.get(
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

        this.projectCacheKeys.add(findProjectWorkCacheKey);
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

  async updateProject(
    projectId: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<UpdateProject> {
    try {
      const { userId, ...updateData } = updateProjectDto;

      const [_project, user] = await Promise.all([
        this.prismaService.project.findFirst({
          where: { id: projectId },
          include: {
            works: { include: { tasks: { include: { subtasks: true } } } },
            author: { select: { firstName: true, lastName: true } },
          },
        }),
        this.prismaService.user.findFirst({ where: { id: userId } }),
      ]);

      if (!_project)
        throw new NotFoundException(
          `Project with the id ${projectId} not found.`,
        );

      if (!user)
        throw new NotFoundException(`User with the id ${projectId} not found.`);

      firstDateGreaterThanSecondDate(
        updateData.startDate,
        updateData.endDate,
        'Project',
      );

      const { works, ...project } = _project;

      validateProjectDepth(project, works);

      const updatedProject = await this.prismaService.$transaction(
        async (prisma) => {
          const project = await prisma.project.update({
            where: { id: projectId },
            data: { ...updateData },
          });

          await this.prismaService.log.create({
            data: {
              logMethodId: LogMethod.UPDATE,
              logTypeId: LogType.PROJECT,
              editedBy: userId,
              logs: getPreviousValues(project, updateProjectDto),
            },
          });

          return project;
        },
      );

      if (!updatedProject)
        throw new BadRequestException(
          'There was a problem in updating the project.',
        );

      const updateProjectCacheKey = generateCacheKey(
        Namespace.GENERAL,
        Identifier.PROJECT,
        {
          projectId,
        },
      );

      await this.cacheManager.set(updateProjectCacheKey, {
        ...project,
        ...updateData,
      });

      return { message: `Project updated successfully` };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeProject(
    projectId: number,
    userId: number,
  ): Promise<RemoveProject> {
    try {
      const [user, project] = await Promise.all([
        this.prismaService.user.findFirst({
          where: { id: userId },
        }),
        this.prismaService.project.findFirst({
          where: { id: projectId },
        }),
      ]);

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found`);

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

      const deleteProjectCacheKey = generateCacheKey(
        Namespace.GENERAL,
        Identifier.PROJECT,
        {
          projectId,
        },
      );

      await this.cacheManager.del(deleteProjectCacheKey);

      return { message: 'Project deleted successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
