import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  clearKeys,
  findDataById,
  generateCacheKey,
  getPreviousValues,
  handleErrors,
} from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import {
  EntityType,
  Identifier,
  LogMethod,
  LogType,
  Namespace,
  PaginationDefault,
} from 'src/utils/enums';
import { Department, User } from '@prisma/client';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CreateDepartment,
  FindDepartment,
  FindDepartments,
  FindDepartmentUser,
  FindDepartmentUsers,
  RemoveDepartment,
  UpdateDepartment,
} from 'src/types/types';

@Injectable()
export class DepartmentService {
  private logger = new Logger('DepartmentService');
  private namespace: string = 'DEPARTMENT:';
  private departmentCacheKeys: Set<string> = new Set<string>();

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<CreateDepartment> {
    try {
      const { userId, ...createDepartmentData } = createDepartmentDto;

      findDataById(this.prismaService, userId, EntityType.USER);

      await this.prismaService.department.create({
        data: {
          ...createDepartmentData,
        },
      });

      clearKeys(
        this.departmentCacheKeys,
        this.cacheManager,
        this.logger,
        'Department',
      );

      return { message: 'Department created successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartments(query: FindAllDto): Promise<FindDepartments> {
    const { search, offset, limit, sortBy, sortOrder } = query;
    const findDepartmentsCacheKey: string = generateCacheKey(
      this.namespace,
      'findDepartments',
      query,
    );

    try {
      let departments: Department[], count: number;

      const cachedDepartments: { departments: Department[]; count: number } =
        await this.cacheManager.get(findDepartmentsCacheKey);

      if (cachedDepartments) {
        this.logger.debug(`Departments cache hit.`);

        departments = cachedDepartments.departments;
        count = cachedDepartments.count;
      } else {
        this.logger.debug(`Departments cache missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

        departments = await this.prismaService.department.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.department.count({
          where,
        });

        await this.cacheManager.set(findDepartmentsCacheKey, {
          departments,
          count,
        });

        this.departmentCacheKeys.add(findDepartmentsCacheKey);
      }

      return {
        message: 'Departments loaded successfully',
        count,
        departments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartment(deptId: number): Promise<FindDepartment> {
    try {
      const findDepartmentCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DEPARTMENT,
        { deptId },
      );
      let department: Department;
      const cachedDepartment: Department = await this.cacheManager.get(
        findDepartmentCacheKey,
      );

      if (cachedDepartment) {
        this.logger.debug(`Department with the id ${deptId} cache hit.`);

        department = cachedDepartment;
      } else {
        this.logger.debug(`Department with the id ${deptId} cache missed.`);

        department = await this.prismaService.department.findFirst({
          where: { id: deptId },
        });

        if (!department)
          throw new NotFoundException(
            `Department with the id ${deptId} not found.`,
          );

        await this.cacheManager.set(findDepartmentCacheKey, department);
      }

      return { message: 'Department loaded successfully', department };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartmentUsers(
    departmentId: number,
    query: FindAllDto,
  ): Promise<FindDepartmentUsers> {
    const { search, offset, limit, sortBy, sortOrder } = query;

    try {
      findDataById(this.prismaService, departmentId, EntityType.DEPARTMENT);

      const findDepartmentUsersCacheKey: string = generateCacheKey(
        this.namespace,
        'findDepartmentUsers',
        { ...query, departmentId },
      );

      let users: User[], count: number;

      const cachedDepartmentUsers: { users: User[]; count: number } =
        await this.cacheManager.get(findDepartmentUsersCacheKey);

      if (cachedDepartmentUsers) {
        this.logger.debug(`Department Users cache hit.`);

        users = cachedDepartmentUsers.users;
        count = cachedDepartmentUsers.count;
      } else {
        this.logger.debug(`Department Users cache missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }),
          departmentId,
        };
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

        users = await this.prismaService.user.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });
        count = await this.prismaService.user.count({ where });

        await this.cacheManager.set(findDepartmentUsersCacheKey, {
          users,
          count,
        });

        this.departmentCacheKeys.add(findDepartmentUsersCacheKey);
      }

      return {
        message: `Department's users loaded successfully`,
        count,
        users,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartmentUser(
    deptId: number,
    userId: number,
  ): Promise<FindDepartmentUser> {
    try {
      const findDepartmentUserCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.USER,
        { userId },
      );

      let user: User;

      const departmentUser: User = await this.cacheManager.get(
        findDepartmentUserCacheKey,
      );

      if (departmentUser) {
        this.logger.debug(`Department User with the id ${userId} cache hit.`);

        user = departmentUser;
      } else {
        this.logger.debug(
          `Department User with the id ${userId} cache missed.`,
        );

        user = await this.prismaService.user.findFirst({
          where: { id: userId, departmentId: deptId },
        });

        if (!user)
          throw new NotFoundException(
            `Department user with the id ${userId} not found.`,
          );

        await this.cacheManager.set(findDepartmentUserCacheKey, user);
      }

      return {
        message: `Department user loaded successfully.`,
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateDepartment(
    deptId: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<UpdateDepartment> {
    const { userId, ...updateData } = updateDepartmentDto;
    try {
      const department = await this.prismaService.department.findFirst({
        where: { id: deptId },
      });

      if (!department)
        throw new NotFoundException(`Department with the ${deptId} not found.`);

      const updatedDepartmentLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(department, updateData),
          editedBy: userId,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.DEPARTMENT,
        },
      });

      if (!updatedDepartmentLog)
        throw new BadRequestException('There was a problem in creating a log.');

      await this.prismaService.department.update({
        where: { id: deptId },
        data: updateData,
      });

      const updateDepartmentCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DEPARTMENT,
        { deptId },
      );

      await this.cacheManager.set(updateDepartmentCacheKey, {
        ...department,
        ...updateData,
      });

      return { message: 'Department updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeDepartment(
    deptId: number,
    userId: number,
  ): Promise<RemoveDepartment> {
    try {
      const department = await this.prismaService.department.findFirst({
        where: { id: deptId },
      });

      if (!department)
        throw new NotFoundException(
          `Department with the id ${deptId} not found.`,
        );

      findDataById(this.prismaService, userId, EntityType.USER);

      const deletedDepartmentLog = await this.prismaService.log.create({
        data: {
          logs: department,
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.DEPARTMENT,
        },
      });

      if (!deletedDepartmentLog)
        throw new BadRequestException(`There was a problem in creating a log`);

      await this.prismaService.department.delete({ where: { id: deptId } });

      const deleteDepartmentCacheKey = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DEPARTMENT,
        {
          deptId,
        },
      );

      await this.cacheManager.del(deleteDepartmentCacheKey);

      return {
        message: 'Department deleted successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
