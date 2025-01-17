import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  clearKeys,
  firstDateGreaterThanSecondDate,
  generateCacheKey,
  getPreviousValues,
  handleErrors,
  validateParentAndChildDates,
} from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import {
  Identifier,
  LogMethod,
  LogType,
  PaginationDefault,
} from 'src/utils/enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Task, Work } from '@prisma/client';
import {
  CreateWork,
  FindWork,
  FindWorks,
  FindWorkTask,
  FindWorkTasks,
  RemoveWork,
  UpdateWork,
} from 'src/types/types';

@Injectable()
export class WorkService {
  private logger = new Logger('WorkService');
  private workCacheKeys: Set<string> = new Set<string>();
  private namespace: string = 'WORK:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createWork(createWorkDto: CreateWorkDto): Promise<CreateWork> {
    try {
      firstDateGreaterThanSecondDate(
        createWorkDto.startDate,
        createWorkDto.endDate,
        'Work',
      );

      const [user, project] = await Promise.all([
        this.prismaService.user.findFirst({
          where: { id: createWorkDto.authorId },
        }),
        this.prismaService.project.findFirst({
          where: { id: createWorkDto.projectId },
        }),
      ]);

      if (!user)
        throw new NotFoundException(
          `User with the id ${createWorkDto.authorId} not found`,
        );

      if (!project)
        throw new NotFoundException(
          `Project with the id ${createWorkDto.projectId} not found.`,
        );

      validateParentAndChildDates(createWorkDto, project, 'work', 'project');

      await this.prismaService.work.create({
        data: {
          ...createWorkDto,
        },
      });

      clearKeys(this.workCacheKeys, this.cacheManager, this.logger, 'Work');

      return {
        message: 'Work created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorks(query: FindAllDto): Promise<FindWorks> {
    const { search, offset, limit, type, dateWithin, sortOrder, sortBy } =
      query;
    const worksCacheKey = generateCacheKey(this.namespace, 'findWorks', query);
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      let works: Work[], count: number;
      const cachedWorks: { works: Work[]; count: number } =
        await this.cacheManager.get(worksCacheKey);

      if (cachedWorks) {
        this.logger.debug('Works cache hit.');
        works = cachedWorks.works;
        count = cachedWorks.count;
      } else {
        this.logger.debug('Works cache missed.');

        const where: object = {
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
          ...(type && { type }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
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

        await this.cacheManager.set(worksCacheKey, { works, count });

        this.workCacheKeys.add(worksCacheKey);
      }

      return {
        message: 'Works loaded successfully',
        count,
        works,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWork(workId: number): Promise<FindWork> {
    let work: Work;
    const findWorkCacheKey = generateCacheKey(this.namespace, Identifier.WORK, {
      workId,
    });
    const cachedWork: Work = await this.cacheManager.get(findWorkCacheKey);

    try {
      if (cachedWork) {
        this.logger.debug(`Work with the id ${workId} cache hit.`);

        work = cachedWork;
      } else {
        this.logger.debug(`Work with the id ${workId} cache missed.`);

        work = await this.prismaService.work.findFirst({
          where: { id: workId },
        });

        if (!work)
          throw new NotFoundException(`Work with the id ${workId} not found.`);

        await this.cacheManager.set(findWorkCacheKey, work);
      }

      return {
        message: 'Work loaded successfully.',
        work,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorkTasks(
    workId: number,
    query: FindAllDto,
  ): Promise<FindWorkTasks> {
    const { offset, limit, search, type, sortBy, sortOrder, dateWithin } =
      query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findWorkTasksCacheKey = generateCacheKey(
      this.namespace,
      'findWorkTasks',
      { ...query, workId },
    );

    try {
      const work: Work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found`);

      let tasks: Task[], count: number;

      const cachedTasks: { tasks: Task[]; count: number } =
        await this.cacheManager.get(findWorkTasksCacheKey);

      if (cachedTasks) {
        this.logger.debug('Work tasks cache hit.');

        tasks = cachedTasks.tasks;
        count = cachedTasks.count;
      } else {
        this.logger.debug('Work tasks cache missed.');

        const where: object = {
          workId,
          ...(type && { type: { mode: 'insensitive', equals: type } }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
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

        tasks = await this.prismaService.task.findMany({
          where,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
          orderBy,
        });

        count = await this.prismaService.task.count({
          where,
        });

        await this.cacheManager.set(findWorkTasksCacheKey, { tasks, count });

        this.workCacheKeys.add(findWorkTasksCacheKey);
      }

      return {
        message: 'Work tasks loaded successfully',
        count,
        tasks,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorkTask(workId: number, taskId: number): Promise<FindWorkTask> {
    const workTaskCacheKey = generateCacheKey(this.namespace, Identifier.TASK, {
      taskId,
    });

    try {
      let task: Task;
      const cachedWorkTask: Task =
        await this.cacheManager.get(workTaskCacheKey);

      if (cachedWorkTask) {
        this.logger.debug(`Work task with the id ${taskId} cache hit.`);

        task = cachedWorkTask;
      } else {
        this.logger.debug(`Work task with the id ${taskId} cache missed.`);

        task = await this.prismaService.task.findFirst({
          where: { id: taskId, workId },
        });

        await this.cacheManager.set(workTaskCacheKey, task);
      }

      if (!task)
        throw new NotFoundException(
          `Task with the id ${taskId} not found in work ${workId}`,
        );

      return {
        message: 'Task of the work loaded successfully.',
        task,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateWork(
    workId: number,
    updateWorkDto: UpdateWorkDto,
  ): Promise<UpdateWork> {
    const { editedBy, ...updateData } = updateWorkDto;
    try {
      firstDateGreaterThanSecondDate(
        updateWorkDto.startDate,
        updateWorkDto.endDate,
        'Work',
      );

      const [work, user] = await Promise.all([
        this.prismaService.work.findFirst({
          where: { id: workId },
        }),
        await this.prismaService.user.findFirst({
          where: { id: editedBy },
        }),
      ]);

      if (!work)
        throw new NotFoundException(`Work with he id ${workId} not found.`);

      if (!user)
        throw new NotFoundException(
          `User with the id ${updateWorkDto.editedBy} not found.`,
        );

      const project = await this.prismaService.project.findFirst({
        where: { id: work.projectId },
      });

      if (!project)
        throw new NotFoundException(
          `Project with the id ${work.projectId} not found.`,
        );

      validateParentAndChildDates(updateWorkDto, project, 'work', 'project');

      const updatedWork = await this.prismaService.$transaction(
        async (prisma) => {
          const work = await prisma.work.update({
            where: { id: workId },
            data: {
              ...updateData,
            },
          });

          await this.prismaService.log.create({
            data: {
              logs: getPreviousValues(work, updateData),
              editedBy: editedBy,
              logMethodId: LogMethod.UPDATE,
              logTypeId: LogType.WORK,
            },
          });

          return work;
        },
      );

      if (!updatedWork)
        throw new BadRequestException(
          'There was a problem in updating the data',
        );

      const updateWorkCacheKey = generateCacheKey(
        this.namespace,
        Identifier.WORK,
        {
          workId,
        },
      );

      await this.cacheManager.set(updateWorkCacheKey, {
        ...work,
        ...updateData,
      });

      return { message: 'Work updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeWork(workId: number, userId: number): Promise<RemoveWork> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found.`);

      const deletedWork = await this.prismaService.work.delete({
        where: { id: workId },
      });

      if (!deletedWork)
        throw new BadRequestException(
          'There was a problem in deleting the work.',
        );

      const deletedWorkLog = await this.prismaService.log.create({
        data: {
          editedBy: userId,
          logs: work,
          logTypeId: LogType.WORK,
          logMethodId: LogMethod.DELETE,
        },
      });

      if (!deletedWorkLog)
        throw new BadRequestException(
          'There was a problem in creating the log.',
        );

      const deleteWorkCacheKey = generateCacheKey(
        this.namespace,
        Identifier.WORK,
        {
          workId,
        },
      );

      await this.cacheManager.del(deleteWorkCacheKey);

      return { message: 'Work deleted successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
