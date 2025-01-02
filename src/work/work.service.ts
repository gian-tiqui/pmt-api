import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPreviousValues, handleErrors } from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';

@Injectable()
export class WorkService {
  private logger = new Logger('WorkService');

  constructor(private readonly prismaService: PrismaService) {}

  async createWork(createWorkDto: CreateWorkDto) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: createWorkDto.authorId },
      });

      if (!user)
        throw new NotFoundException(
          `User with the id ${createWorkDto.authorId} not found`,
        );

      await this.prismaService.work.create({
        data: {
          ...createWorkDto,
        },
      });

      return {
        message: 'Work created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorks(query: FindAllDto) {
    const {
      search,
      offset,
      limit,
      type,
      startDate,
      endDate,
      sortOrder,
      sortBy,
    } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const options = {
      ...(startDate &&
        endDate && {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        }),
    };

    try {
      const works = await this.prismaService.work.findMany({
        where: {
          type: { mode: 'insensitive', equals: type },
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

      const count = await this.prismaService.work.count({
        where: {
          type: { mode: 'insensitive', equals: type },
          ...options,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Works loaded successfully',
        works,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWork(workId: number) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found.`);

      return {
        message: 'Work loaded successfully.',
        work,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorkTasks(workId: number, query: FindAllDto) {
    const { offset, limit, search, type, sortBy, sortOrder } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found`);

      const tasks = await this.prismaService.task.findMany({
        where: {
          workId,
          ...(type && { type: { mode: 'insensitive', equals: type } }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
        orderBy,
      });

      const count = await this.prismaService.task.count({
        where: {
          workId,
          ...(type && { type: { mode: 'insensitive', equals: type } }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Work tasks loaded successfully',
        tasks,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorkTask(workId: number, taskId: number) {
    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: taskId, workId },
      });

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

  async updateWork(workId: number, updateWorkDto: UpdateWorkDto) {
    const { editedBy, ...updateData } = updateWorkDto;
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with he id ${workId} not found.`);

      const user = await this.prismaService.user.findFirst({
        where: { id: editedBy },
      });

      if (!user)
        throw new NotFoundException(
          `User with the id ${updateWorkDto.editedBy} not found.`,
        );

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

      return { message: 'Work updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeWork(workId: number, userId: number) {
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

      return { message: 'Work deleted successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
