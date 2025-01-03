import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { getPreviousValues, handleErrors } from 'src/utils/functions';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';

@Injectable()
export class TaskService {
  private logger = new Logger('TaskService');

  constructor(private readonly prismaService: PrismaService) {}

  async createTask(createTaskDto: CreateTaskDto) {
    try {
      const newTask = await this.prismaService.task.create({
        data: {
          ...createTaskDto,
        },
      });

      if (!newTask)
        throw new BadRequestException(`There was a problem in creating a task`);

      return {
        message: 'Task created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTasks(query: FindAllDto) {
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

    const options = {
      ...(dateWithin && {
        AND: [
          { startDate: { gte: dateWithin } },
          { endDate: { lte: dateWithin } },
        ],
      }),
      ...(type && { type }),
      ...(status && { status }),
    };

    try {
      const tasks = await this.prismaService.task.findMany({
        where: {
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...options,
        },
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.task.count({
        where: {
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...options,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Tasks loaded successfully.',
        tasks,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTask(taskId: number) {
    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId },
      });

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      return {
        message: 'Task loaded successfully.',
        task,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskSubtasks(taskId: number, query: FindAllDto) {
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

    const options = {
      ...(dateWithin && {
        AND: [
          { startDate: { gte: dateWithin } },
          { endDate: { lte: dateWithin } },
        ],
      }),
      ...(type && { type }),
      ...(status && { status }),
    };

    try {
      const tasks = await this.prismaService.task.findMany({
        where: {
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...options,
          parentId: taskId,
        },
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.task.count({
        where: {
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...options,
          parentId: taskId,
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Subtasks loaded successfully.',
        tasks,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskSubtask(taskId: number, subTaskId: number) {
    try {
      const subTask = await this.prismaService.task.findFirst({
        where: {
          id: subTaskId,
          parentId: taskId,
        },
      });

      if (!subTask)
        throw new NotFoundException(
          `Subtask with the id ${subTaskId} not found in task ${taskId}`,
        );

      return {
        message: 'Subtask loaded successfully.',
        subTask,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskComments(taskId: number, query: FindAllDto) {
    const { search, sortBy, sortOrder, offset, limit } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const task = await this.prismaService.task.findFirst();

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      const comments = await this.prismaService.comment.findMany({
        where: { message: { contains: search, mode: 'insensitive' } },
        orderBy,
        skip: offset,
        take: limit,
      });

      const count = await this.prismaService.comment.count({
        where: { message: { contains: search, mode: 'insensitive' } },
        skip: offset,
        take: limit,
      });

      return {
        message: 'Task comments successfully loaded.',
        comments,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findTaskComment(taskId: number, commentId: number) {
    try {
      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId, taskId },
      });

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

  async updateTask(taskId: number, updateTaskDto: UpdateTaskDto) {
    const { userId, ...updateData } = updateTaskDto;
    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId },
      });

      if (!task)
        throw new NotFoundException(`Task with the id ${taskId} not found.`);

      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

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

      return { message: 'Work updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeTask(taskId: number, userId: number) {
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

      return { message: 'Task deleted successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
