import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPreviousValues, handleErrors } from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const newUser = await this.prismaService.user.create({
        data: { ...createUserDto },
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

  async findUsers(query: FindAllDto) {
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
      const users = await this.prismaService.user.findMany({
        where: {
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(departmentId && { departmentId }),
          ...(divisionId && { divisionId }),
        },
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.user.count({
        where: {
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(departmentId && { departmentId }),
          ...(divisionId && { divisionId }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Users loaded successfully.',
        users,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUser(userId: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      return {
        message: 'User loaded successfully.',
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserComments(userId: number, query: FindAllDto) {
    const { search, offset, limit, sortOrder, sortBy } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const comments = await this.prismaService.comment.findMany({
        where: {
          userId,
          ...(search && {
            AND: [{ message: { contains: search, mode: 'insensitive' } }],
          }),
        },

        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.comment.count({
        where: {
          userId,
          ...(search && {
            AND: [{ message: { contains: search, mode: 'insensitive' } }],
          }),
        },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      return {
        message: 'Comments of the user loaded successfully',
        comments,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserComment(userId: number, commentId: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId, userId },
      });

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

  async findUserWorks(userId: number, query: FindAllDto) {
    const { dateWithin, offset, limit, search, sortBy, sortOrder, type } =
      query;
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
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${userId} not found.`);

      const works = await this.prismaService.work.findMany({
        where: {
          authorId: userId,
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
          authorId: userId,
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
        message: 'Works of the user loaded successfully.',
        works,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findUserWork(userId: number, workId: number) {
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

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
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

      await this.prismaService.user.delete({ where: { id: userId } });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeUser(userId: number, editedBy: number) {
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
