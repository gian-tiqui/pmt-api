import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  clearKeys,
  filterUsers,
  firstDateGreaterThanSecondDate,
  generateCacheKey,
  getPreviousValues,
  handleErrors,
  sanitizeUser,
  validateParentAndChildDates,
} from 'src/utils/functions';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import {
  Identifier,
  LogMethod,
  LogType,
  PaginationDefault,
} from 'src/utils/enums';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Comment, Task, User } from '@prisma/client';
import {
  CreateTask,
  FindTask,
  FindTaskComment,
  FindTaskComments,
  FindTasks,
  FindTaskSubtask,
  FindTaskSubtasks,
  FindTaskUser,
  FindTaskUsers,
  RemoveTask,
  UpdateTask,
} from 'src/types/types';
import { subtle } from 'crypto';

@Injectable()
export class TaskService {
  private logger = new Logger('TaskService');
  private namespace: string = 'TASK:';
  private taskCacheKeys: Set<string> = new Set<string>();

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<CreateTask> {
    try {
      firstDateGreaterThanSecondDate(
        createTaskDto.startDate,
        createTaskDto.endDate,
        'Work',
      );

      const [user, work] = await Promise.all([
        this.prismaService.user.findFirst({
          where: { id: createTaskDto.assignedToId },
        }),
        this.prismaService.work.findFirst({
          where: { id: createTaskDto.workId },
        }),
      ]);

      if (!user)
        throw new NotFoundException(
          `User with the id ${createTaskDto.assignedToId} not found.`,
        );

      if (!work)
        throw new NotFoundException(
          `Work with the id ${createTaskDto.workId} not found.`,
        );

      if (createTaskDto.parentId) {
        const parentTask = await this.prismaService.task.findFirst({
          where: { id: createTaskDto.parentId },
        });

        if (!parentTask) throw new NotFoundException(`Parent task not found`);

        validateParentAndChildDates(
          createTaskDto,
          parentTask,
          'subtask',
          'task',
        );
      }

      validateParentAndChildDates(createTaskDto, work, 'task', 'work');

      clearKeys(this.taskCacheKeys, this.cacheManager, this.logger, 'Task');

      await this.prismaService.task.create({
        data: {
          ...createTaskDto,
        },
      });

      return {
        message: 'Task created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTasks(query: FindAllDto): Promise<FindTasks> {
    const {
      limit,
      offset,
      search,
      sortBy,
      sortOrder,
      dateWithin,
      status,
      type,
    } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findTasksCacheKey = generateCacheKey(
      this.namespace,
      'findTasks',
      query,
    );

    try {
      let tasks: Task[], count: number;

      const cachedTasks: { tasks: Task[]; count: number } =
        await this.cacheManager.get(findTasksCacheKey);

      if (cachedTasks) {
        this.logger.debug('Tasks cache hit.');

        tasks = cachedTasks.tasks;
        count = cachedTasks.count;
      } else {
        this.logger.debug('Tasks cache missed.');

        const where: object = {
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
          ...(type && { type }),
          ...(status && { status }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };

        tasks = await this.prismaService.task.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.task.count({
          where,
        });

        await this.cacheManager.set(findTasksCacheKey, { tasks, count });

        this.taskCacheKeys.add(findTasksCacheKey);
      }

      return {
        message: 'Tasks loaded successfully.',
        count,
        tasks,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTask(taskId: number): Promise<FindTask> {
    try {
      let task: Task;
      const findTaskCacheKey: string = generateCacheKey(
        this.namespace,
        Identifier.TASK,
        { taskId },
      );

      const cachedTask: Task = await this.cacheManager.get(findTaskCacheKey);

      if (cachedTask) {
        this.logger.debug(`Task with the id ${taskId} cache hit.`);

        task = cachedTask;
      } else {
        this.logger.debug(`Task with the id ${taskId} cache missed.`);

        task = await this.prismaService.task.findFirst({
          where: { id: taskId },
        });

        if (!task)
          throw new NotFoundException(`Task with the id ${taskId} not found.`);

        await this.cacheManager.set(findTaskCacheKey, task);
      }

      return {
        message: 'Task loaded successfully.',
        task,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskSubtasks(
    taskId: number,
    query: FindAllDto,
  ): Promise<FindTaskSubtasks> {
    const {
      limit,
      offset,
      search,
      sortBy,
      sortOrder,
      dateWithin,
      status,
      type,
    } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId },
      });

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      let subTasks: Task[], count: number;
      const findTaskSubtasksCacheKey = generateCacheKey(
        this.namespace,
        'findTaskSubtasks',
        { ...query, taskId },
      );
      const cachedTaskSubtasks: { subTasks: Task[]; count: number } =
        await this.cacheManager.get(findTaskSubtasksCacheKey);

      if (cachedTaskSubtasks) {
        this.logger.debug('Sub Tasks cache hit.');

        subTasks = cachedTaskSubtasks.subTasks;
        count = cachedTaskSubtasks.count;
      } else {
        this.logger.debug('Sub Tasks cache missed.');

        const where: object = {
          ...(dateWithin && {
            AND: [
              { startDate: { gte: dateWithin } },
              { endDate: { lte: dateWithin } },
            ],
          }),
          ...(type && { type }),
          ...(status && { status }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          parentId: taskId,
        };

        subTasks = await this.prismaService.task.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.task.count({
          where,
        });

        this.cacheManager.set(findTaskSubtasksCacheKey, { subTasks, count });

        this.taskCacheKeys.add(findTaskSubtasksCacheKey);
      }

      return {
        message: 'Subtasks loaded successfully.',
        count,
        subTasks,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskSubtask(
    taskId: number,
    subTaskId: number,
  ): Promise<FindTaskSubtask> {
    const findTaskSubtaskCacheKey = generateCacheKey(
      this.namespace,
      Identifier.TASK,
      { subTaskId },
    );

    try {
      let subTask: Task;
      const cachedSubTask: Task = await this.cacheManager.get(
        findTaskSubtaskCacheKey,
      );

      if (cachedSubTask) {
        this.logger.debug(`Task Sub Task with the id ${subTaskId} cache hit.`);

        subTask = cachedSubTask;
      } else {
        this.logger.debug(
          `Task Sub Task with the id ${subTaskId} cache missed.`,
        );

        subTask = await this.prismaService.task.findFirst({
          where: {
            id: subTaskId,
            parentId: taskId,
          },
        });

        if (!subTask)
          throw new NotFoundException(
            `Subtask with the id ${subTaskId} not found in task ${taskId}`,
          );

        await this.cacheManager.set(findTaskSubtaskCacheKey, subtle);
      }

      return {
        message: 'Sub Task loaded successfully.',
        subTask,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskUsers(
    taskId: number,
    query: FindAllDto,
  ): Promise<FindTaskUsers> {
    const { search, offset, limit, sortBy, sortOrder } = query;

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    const findTaskUsersCacheKey = generateCacheKey(
      this.namespace,
      'findTaskUsers',
      { ...query, taskId },
    );

    try {
      let task: Task & { subtasks: { assignedTo: User }[] },
        users: User[],
        count: number;

      const cachedTaskUsers: { users: User[]; count: number } =
        await this.cacheManager.get(findTaskUsersCacheKey);

      if (cachedTaskUsers) {
        this.logger.debug(`Task Users cache hit.`);

        users = cachedTaskUsers.users;
        count = cachedTaskUsers.count;
      } else {
        this.logger.debug(`Task Users cache missed.`);

        task = (await this.prismaService.task.findFirst({
          where: { id: taskId, parentId: null },
          select: { subtasks: { select: { assignedTo: true } } },
        })) as Task & { subtasks: { assignedTo: User }[] };

        if (!task)
          throw new BadRequestException(
            `Task with the id ${taskId} not found.`,
          );

        users = task.subtasks.map(
          (subtask: Task & { assignedTo: User }) => subtask.assignedTo,
        );

        sanitizeUser(users);

        count = task.subtasks.length;

        await this.cacheManager.set(findTaskUsersCacheKey, { users, count });

        this.taskCacheKeys.add(findTaskUsersCacheKey);
      }

      return {
        message: 'Users of the task loaded successfully.',
        count,
        users: filterUsers(users, search, offset, limit, orderBy),
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskUser(taskId: number, userId: number): Promise<FindTaskUser> {
    const findTaskUserCacheKey: string = generateCacheKey(
      this.namespace,
      Identifier.USER,
      { userId },
    );

    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId, subtasks: { some: { assignedToId: userId } } },
      });

      if (!task)
        throw new NotFoundException(
          `User with the id ${userId} is not found in task ${taskId}`,
        );

      let user: User;
      const cachedUser: User =
        await this.cacheManager.get(findTaskUserCacheKey);

      if (cachedUser) {
        this.logger.debug(`Task User with the id ${userId} cache hit.`);

        user = cachedUser;
      } else {
        this.logger.debug(`Task User with the id ${userId} cache missed.`);

        user = await this.prismaService.user.findFirst({
          where: { id: userId },
        });

        sanitizeUser([user]);

        await this.cacheManager.set(findTaskUserCacheKey, user);
      }

      return {
        message: 'User of the task loaded successfully',
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskComments(
    taskId: number,
    query: FindAllDto,
  ): Promise<FindTaskComments> {
    const { search, sortBy, sortOrder, offset, limit } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findTaskCommentsCacheKey: string = generateCacheKey(
      this.namespace,
      'findTaskComments',
      { ...query, taskId },
    );

    try {
      const task = await this.prismaService.task.findFirst();

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      let comments: Comment[], count: number;
      const cachedComments: { comments: Comment[]; count: number } =
        await this.cacheManager.get(findTaskCommentsCacheKey);

      if (cachedComments) {
        this.logger.debug(`Task Comments cache hit.`);

        comments = cachedComments.comments;
        count = cachedComments.count;
      } else {
        this.logger.debug(`Task comment cache missed.`);

        const where: object = {
          message: { contains: search, mode: 'insensitive' },
        };

        comments = await this.prismaService.comment.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
        });

        count = await this.prismaService.comment.count({
          where,
        });

        await this.cacheManager.set(findTaskCommentsCacheKey, {
          comments,
          count,
        });

        this.taskCacheKeys.add(findTaskCommentsCacheKey);
      }

      return {
        message: 'Task comments successfully loaded.',
        count,
        comments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskComment(
    taskId: number,
    commentId: number,
  ): Promise<FindTaskComment> {
    const findTaskCommentCacheKey = generateCacheKey(
      this.namespace,
      Identifier.COMMENT,
      { commentId },
    );

    try {
      let comment: Comment;
      const cachedComment: Comment = await this.cacheManager.get(
        findTaskCommentCacheKey,
      );

      if (cachedComment) {
        this.logger.debug(`Task Comment with id ${commentId} cache hit.`);

        comment = cachedComment;
      } else {
        this.logger.debug(`Task Comment with id ${commentId} cache missed.`);

        comment = await this.prismaService.comment.findFirst({
          where: { id: commentId, taskId },
        });

        if (!comment)
          throw new NotFoundException(
            `Comment with the ${commentId} not found.`,
          );

        await this.cacheManager.set(findTaskCommentCacheKey, comment);
      }

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} in task ${taskId} not found.`,
        );

      return {
        message: 'Comment loaded successfully',
        comment,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateTask(
    taskId: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<UpdateTask> {
    const { userId, ...updateData } = updateTaskDto;
    try {
      firstDateGreaterThanSecondDate(
        updateTaskDto.startDate,
        updateTaskDto.endDate,
        'Task',
      );

      const task = await this.prismaService.task.findFirst({
        where: { id: taskId },
      });

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      if (!task.current && task.parentId)
        throw new BadRequestException(`The task cannot be edited.`);

      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      if (updateTaskDto.parentId) {
        const parentTask = await this.prismaService.task.findFirst({
          where: { id: updateTaskDto.parentId },
        });

        if (!parentTask) throw new NotFoundException(`Parent task not found`);

        validateParentAndChildDates(
          updateTaskDto,
          parentTask,
          'subtask',
          'task',
        );
      }

      const work = await this.prismaService.work.findFirst({
        where: { id: updateTaskDto.workId },
      });

      if (!work)
        throw new NotFoundException(
          `Work with the id ${updateTaskDto.workId} not found.`,
        );

      validateParentAndChildDates(updateTaskDto, work, 'task', 'work');

      const updatedTask = await this.prismaService.task.update({
        where: { id: taskId },
        data: { ...updateData },
      });

      if (!updatedTask)
        throw new BadRequestException(`There was a problem in updating task.`);

      const updatedTaskLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(task, updateData),
          editedBy: userId,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.WORK,
        },
      });

      if (!updatedTaskLog)
        throw new BadRequestException(
          `There was a problem in creating the log.`,
        );

      const updateTaskCacheKey: string = generateCacheKey(
        this.namespace,
        Identifier.TASK,
        { taskId },
      );

      await this.cacheManager.set(updateTaskCacheKey, {
        ...task,
        ...updateData,
      });

      return { message: 'Work updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeTask(taskId: number, userId: number): Promise<RemoveTask> {
    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId },
      });

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      const deletedTaskLog = await this.prismaService.log.create({
        data: {
          logs: { ...task },
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.TASK,
        },
      });

      if (!deletedTaskLog)
        throw new BadRequestException(`There was a problem in creatinga log`);

      await this.prismaService.task.delete({ where: { id: taskId } });

      const deleteTaskCacheKey: string = generateCacheKey(
        this.namespace,
        Identifier.TASK,
        { taskId },
      );

      await this.cacheManager.del(deleteTaskCacheKey);

      return { message: 'Task deleted successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
