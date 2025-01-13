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
  Namespace,
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
  private workCacheKeys: string[] = [];
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

      const user = await this.prismaService.user.findFirst({
        where: { id: createWorkDto.authorId },
      });

      if (!user)
        throw new NotFoundException(
          `User with the id ${createWorkDto.authorId} not found`,
        );

      const project = await this.prismaService.project.findFirst({
        where: { id: createWorkDto.projectId },
      });

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

      if (this.workCacheKeys.length > 0) {
        try {
          await Promise.all(
            this.workCacheKeys.map((key) => this.cacheManager.del(key)),
          );

          this.workCacheKeys = [];

          this.logger.verbose('Work find all cache cleared.');
        } catch (error) {
          handleErrors(error, this.logger);
        }
      }

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
    const options = {
      ...(dateWithin && {
        AND: [
          { startDate: { gte: dateWithin } },
          { endDate: { lte: dateWithin } },
        ],
      }),
      ...(type && { type }),
    };

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

        works = await this.prismaService.work.findMany({
          where: {
            ...options,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }),
          },
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.work.count({
          where: {
            ...options,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }),
          },
        });
      }

      await this.cacheManager.set(worksCacheKey, { works, count });

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
    const findWorkCacheKey = generateCacheKey(
      Namespace.GENERAL,
      Identifier.WORK,
      {
        workId,
      },
    );

    const cachedWork: Work = await this.cacheManager.get(findWorkCacheKey);
    try {
      if (cachedWork) {
        this.logger.debug('Work cache hit.');

        work = cachedWork;
      } else {
        this.logger.debug('Work cache missed.');

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
    const findWorkTasksCacheKey = `${this.namespace}work:${workId}-${JSON.stringify(query)}`;

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
        this.logger.debug('Cache hit.');

        tasks = cachedTasks.tasks;
        count = cachedTasks.count;
      } else {
        this.logger.debug('Cache missed.');

        tasks = await this.prismaService.task.findMany({
          where: {
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
          },
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
          orderBy,
        });

        count = await this.prismaService.task.count({
          where: {
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
          },
        });
      }

      await this.cacheManager.set(findWorkTasksCacheKey, { tasks, count });

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
    const workTaskCacheKey = `work-${workId}-task-${taskId}`;

    try {
      let task: Task;
      const cachedWorkTask: Task =
        await this.cacheManager.get(workTaskCacheKey);

      if (cachedWorkTask) {
        this.logger.log('Cache hit.');

        task = cachedWorkTask;
      } else {
        this.logger.log('Cache missed.');

        task = await this.prismaService.task.findFirst({
          where: { id: taskId, workId },
        });
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

      const updatedWork = await this.prismaService.work.update({
        where: { id: workId },
        data: {
          ...updateData,
        },
      });

      if (!updatedWork)
        throw new BadRequestException(
          'There was a problem in updating the data',
        );

      const updatedWorkLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(work, updateData),
          editedBy: editedBy,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.WORK,
        },
      });

      if (!updatedWorkLog)
        throw new BadRequestException(
          `There was a problem in creating the log.`,
        );

      const updateWorkCacheKey = generateCacheKey(
        Namespace.GENERAL,
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
        Namespace.GENERAL,
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
