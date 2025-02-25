import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  getPreviousValues,
  handleErrors,
  sanitizeUser,
} from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import * as argon from 'argon2';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';
import {
  CreateUser,
  FindUser,
  FindUserComment,
  FindUserComments,
  FindUserProject,
  FindUserProjects,
  FindUsers,
  FindUserTask,
  FindUserTasks,
  FindUserWork,
  FindUserWorks,
  RemoveUser,
  UpdateUser,
} from 'src/types/types';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<CreateUser> {
    try {
      const hashedPassword = await argon.hash(createUserDto.password);

      const newUser = await this.prismaService.user.create({
        data: { ...createUserDto, password: hashedPassword },
      });

      if (!newUser)
        throw new BadRequestException(
          `There was a problem in creating a new user.`,
        );

      return {
        message: 'User created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUsers(query: FindAllDto): Promise<FindUsers> {
    const {
      search,
      departmentId,
      divisionId,
      offset,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const where: object = {
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { middleName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(departmentId && { departmentId }),
        ...(divisionId && { divisionId }),
      };

      const users = await this.prismaService.user.findMany({
        where,
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      sanitizeUser(users);

      const count = await this.prismaService.user.count({
        where,
      });

      return {
        message: 'Users loaded successfully.',
        count,
        users,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUser(userId: number): Promise<FindUser> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      sanitizeUser([user]);

      return {
        message: 'User loaded successfully.',
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserComments(
    userId: number,
    query: FindAllDto,
  ): Promise<FindUserComments> {
    const { search, offset, limit, sortOrder, sortBy } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const where: object = {
        userId,
        ...(search && {
          AND: [{ message: { contains: search, mode: 'insensitive' } }],
        }),
      };

      const comments = await this.prismaService.comment.findMany({
        where,

        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.comment.count({
        where,
      });

      return {
        message: 'Comments of the user loaded successfully',
        count,
        comments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserComment(
    userId: number,
    commentId: number,
  ): Promise<FindUserComment> {
    try {
      const [user, comment] = await Promise.all([
        this.prismaService.user.findFirst({
          where: { id: userId },
        }),
        this.prismaService.comment.findFirst({
          where: { id: commentId, userId },
        }),
      ]);

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} not found in user ${userId}`,
        );

      return {
        message: 'Comment of the user loaded successfully.',
        comment,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserWorks(
    userId: number,
    query: FindAllDto,
  ): Promise<FindUserWorks> {
    const { dateWithin, offset, limit, search, sortBy, sortOrder, type } =
      query;

    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });
      const where: object = {
        authorId: userId,
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

      const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const works = await this.prismaService.work.findMany({
        where,
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.work.count({
        where,
      });

      return {
        message: 'Works of the user loaded successfully.',
        count,
        works,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserWork(userId: number, workId: number): Promise<FindUserWork> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const work = await this.prismaService.work.findFirst({
        where: { id: workId, authorId: userId },
      });

      if (!work)
        throw new NotFoundException(
          `Work with the id ${workId} not found in user ${userId}`,
        );

      return {
        message: "User's work loaded successfully",
        work,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserTasks(
    userId: number,
    query: FindAllDto,
  ): Promise<FindUserTasks> {
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
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const tasks = await this.prismaService.task.findMany({
        where: {
          assignedToId: userId,
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
          assignedToId: userId,
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...options,
        },
      });

      return {
        message: 'Tasks loaded successfully.',
        count,
        tasks,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserTask(userId: number, taskId: number): Promise<FindUserTask> {
    try {
      const task = await this.prismaService.task.findFirst({
        where: {
          id: taskId,
          assignedToId: userId,
        },
      });

      if (!task)
        throw new NotFoundException(
          `Task with the id ${taskId} not found in user ${userId}.`,
        );

      return {
        message: 'Task of the user loaded successfully.',
        task,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserProjects(
    userId: number,
    query: FindAllDto,
  ): Promise<FindUserProjects> {
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

      const where: object = {
        ...(status && { status }),
        ...(dateWithin && {
          AND: [
            { startDate: { gte: dateWithin } },
            { endDate: { lte: dateWithin } },
          ],
        }),
        ...(authorId && { authorId }),
        authorId: userId,
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
      };

      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const projects = await this.prismaService.project.findMany({
        where,
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.project.count({
        where,
      });

      return { message: 'Projects loaded successfully.', count, projects };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserProject(
    userId: number,
    projectId: number,
  ): Promise<FindUserProject> {
    try {
      const project = await this.prismaService.project.findFirst({
        where: {
          id: projectId,
          authorId: userId,
        },
      });

      if (!project)
        throw new NotFoundException(
          `Project with the id ${projectId} not found in user ${userId}`,
        );

      return {
        message: 'Project of the user loaded successfully.',
        project,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserDeadlineExtensions(userId: number, query: FindAllDto) {
    try {
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserDeadlineExtension(userId: number, deadlineExtensionId: number) {
    try {
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUser> {
    const { userId: editedBy, ...updateData } = updateUserDto;

    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const updatedUserLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(user, updateData),
          editedBy,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.USER,
        },
      });

      if (!updatedUserLog)
        throw new BadRequestException(
          `There was a problem in creating a user log.`,
        );

      await this.prismaService.user.update({
        where: { id: userId },
        data: { ...updateData },
      });

      return {
        message: 'User updated successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeUser(userId: number, editedBy: number): Promise<RemoveUser> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const deletedUserLog = await this.prismaService.log.create({
        data: {
          logs: { ...user },
          editedBy,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.USER,
        },
      });

      if (!deletedUserLog)
        throw new BadRequestException(`There was a problem in creating a log.`);

      await this.prismaService.user.delete({ where: { id: userId } });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
