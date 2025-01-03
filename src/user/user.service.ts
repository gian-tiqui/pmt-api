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
