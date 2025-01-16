import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  handleErrors,
  findDataById,
  generateCacheKey,
  getPreviousValues,
  clearKeys,
} from 'src/utils/functions';
import {
  CreateDivision,
  FindDivision,
  FindDivisionDepartment,
  FindDivisionDepartments,
  FindDivisions,
  FindDivisionUser,
  FindDivisionUsers,
  RemoveDivision,
} from 'src/types/types';
import {
  EntityType,
  Identifier,
  LogMethod,
  LogType,
  Namespace,
  PaginationDefault,
} from 'src/utils/enums';
import { Department, Division, User } from '@prisma/client';

@Injectable()
export class DivisionService {
  private logger: Logger = new Logger('DivisionService');
  private divisionCacheKeys: Set<string> = new Set<string>();
  private namespace = 'DIVISION:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createDivision(
    createDivisionDto: CreateDivisionDto,
  ): Promise<CreateDivision> {
    const { userId, ...data } = createDivisionDto;
    try {
      await findDataById(this.prismaService, userId, EntityType.USER);

      await this.prismaService.division.create({ data });

      clearKeys(
        this.divisionCacheKeys,
        this.cacheManager,
        this.logger,
        'Division',
      );

      return {
        message: 'Division created successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisions(query: FindAllDto): Promise<FindDivisions> {
    const { search, offset, limit, sortBy, sortOrder } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findDivisionsCacheKey: string = generateCacheKey(
      this.namespace,
      'findDivisions',
      query,
    );

    try {
      let divisions: Division[], count: number;

      const cachedDivisions: { divisions: Division[]; count: number } =
        await this.cacheManager.get(findDivisionsCacheKey);

      if (cachedDivisions) {
        this.logger.debug(`Divisions cache hit.`);

        divisions = cachedDivisions.divisions;
        count = cachedDivisions.count;
      } else {
        this.logger.debug(`Divisions cache missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };

        divisions = await this.prismaService.division.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.division.count({
          where,
        });

        await this.cacheManager.set(findDivisionsCacheKey, {
          divisions,
          count,
        });

        this.divisionCacheKeys.add(findDivisionsCacheKey);
      }

      return {
        message: 'Divisions loaded successfully.',
        count,
        divisions,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivision(divisionId: number): Promise<FindDivision> {
    try {
      const findDivisionCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DIVISION,
        { divisionId },
      );
      let division: Division;
      const cachedDivision: Division =
        await this.cacheManager.get(findDivisionCacheKey);

      if (cachedDivision) {
        this.logger.debug(`Division with the id ${divisionId} hit.`);

        division = cachedDivision;
      } else {
        this.logger.debug(`Division with the id ${divisionId} cache missed.`);

        division = await this.prismaService.division.findFirst({
          where: { id: divisionId },
        });

        await this.cacheManager.set(findDivisionCacheKey, division);
      }

      return {
        message: 'Division loaded successfully.',
        division,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisionUsers(
    divisionId: number,
    query: FindAllDto,
  ): Promise<FindDivisionUsers> {
    const { search, departmentId, offset, limit, sortBy, sortOrder } = query;

    try {
      await findDataById(this.prismaService, divisionId, EntityType.DIVISION);

      const findDivisionUsersCacheKey: string = generateCacheKey(
        this.namespace,
        'findDivisionUsers',
        { ...query, divisionId },
      );

      let users: User[], count: number;

      const cachedDivisionUsers: { users: User[]; count: number } =
        await this.cacheManager.get(findDivisionUsersCacheKey);

      if (cachedDivisionUsers) {
        this.logger.debug(`Division users cache hit.`);

        users = cachedDivisionUsers.users;
        count = cachedDivisionUsers.count;
      } else {
        this.logger.debug(`Division users cache missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }),
          ...(departmentId && { departmentId }),
          divisionId,
        };
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

        users = await this.prismaService.user.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.user.count({
          where,
        });

        await this.cacheManager.set(findDivisionUsersCacheKey, {
          users,
          count,
        });

        this.divisionCacheKeys.add(findDivisionUsersCacheKey);
      }

      return {
        message: 'Division users loaded successfully.',
        count,
        users,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisionUser(
    divisionId: number,
    userId: number,
  ): Promise<FindDivisionUser> {
    try {
      const findDivisionUserCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.USER,
        { userId },
      );

      let user: User;

      const cachedDivisionUser: User = await this.cacheManager.get(
        findDivisionUserCacheKey,
      );

      if (cachedDivisionUser) {
        this.logger.debug(`Division user with the id ${userId} cache hit.`);

        user = cachedDivisionUser;
      } else {
        this.logger.debug(`Division user with the id ${userId} cache missed.`);

        user = await this.prismaService.user.findFirst({
          where: { id: userId, divisionId },
        });

        if (!user)
          throw new NotFoundException(
            `Division user with the id ${userId} not found.`,
          );

        await this.cacheManager.set(findDivisionUserCacheKey, user);
      }

      return {
        message: 'User of the division loaded successfully.',
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisionDepartments(
    divisionId: number,
    query: FindAllDto,
  ): Promise<FindDivisionDepartments> {
    const { search, offset, limit, sortBy, sortOrder } = query;

    try {
      await findDataById(this.prismaService, divisionId, EntityType.DIVISION);

      const findDivisionDepartmentsCacheKey: string = generateCacheKey(
        this.namespace,
        'findDivisionDepartments',
        query,
      );

      let departments: Department[], count: number;

      const cachedDivisionDepartments: {
        departments: Department[];
        count: number;
      } = await this.cacheManager.get(findDivisionDepartmentsCacheKey);

      if (cachedDivisionDepartments) {
        this.logger.debug(`Division departments cache hit.`);

        departments = cachedDivisionDepartments.departments;
        count = cachedDivisionDepartments.count;
      } else {
        this.logger.debug(`Division departments cahce missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
          divisionId,
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

        await this.cacheManager.set(findDivisionDepartmentsCacheKey, {
          departments,
          count,
        });

        this.divisionCacheKeys.add(findDivisionDepartmentsCacheKey);
      }

      return {
        message: 'Division departments loaded successfully.',
        count,
        departments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisionDepartment(
    divisionId: number,
    deptId: number,
  ): Promise<FindDivisionDepartment> {
    try {
      const findDivisionDepartmentCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DEPARTMENT,
        { deptId },
      );

      const cachedDivisionDepartment: Department = await this.cacheManager.get(
        findDivisionDepartmentCacheKey,
      );

      let department: Department;

      if (cachedDivisionDepartment) {
        this.logger.debug(
          `Division department with the id ${deptId} cache hit.`,
        );

        department = cachedDivisionDepartment;
      } else {
        this.logger.debug(
          `Division department with the id ${deptId} cache missed.`,
        );

        department = await this.prismaService.department.findFirst({
          where: { id: deptId, divisionId },
        });

        if (!department)
          throw new NotFoundException(
            `Department with the id ${deptId} not found.`,
          );

        await this.cacheManager.set(findDivisionDepartmentCacheKey, department);
      }

      return {
        message: 'Division department loaded successfully.',
        department,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateDivision(
    divisionId: number,
    updateDivisionDto: UpdateDivisionDto,
  ) {
    const { userId, ...updateData } = updateDivisionDto;
    try {
      await findDataById(this.prismaService, userId, EntityType.USER);

      const division = await this.prismaService.division.findFirst({
        where: { id: divisionId },
      });

      if (!division)
        throw new NotFoundException(
          `Division with the id ${divisionId} not found.`,
        );

      const updatedDivisionLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(division, updateData),
          editedBy: userId,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogType.DIVISION,
        },
      });

      if (!updatedDivisionLog)
        throw new BadRequestException(
          `There was a problem in creating a log for division.`,
        );

      await this.prismaService.division.update({
        where: { id: divisionId },
        data: updateData,
      });

      const updateDivisionCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DIVISION,
        { divisionId },
      );

      await this.cacheManager.set(updateDivisionCacheKey, {
        ...division,
        ...updateData,
      });

      return {
        message: 'Division updated successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeDivision(
    divisionId: number,
    userId: number,
  ): Promise<RemoveDivision> {
    try {
      const division = await this.prismaService.division.findFirst({
        where: { id: divisionId },
      });

      if (!division)
        throw new NotFoundException(
          `Division with the id ${divisionId} not found.`,
        );

      await findDataById(this.prismaService, userId, EntityType.USER);

      const deletedDivisionLog = await this.prismaService.log.create({
        data: {
          logs: division,
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.DIVISION,
        },
      });

      if (!deletedDivisionLog)
        throw new BadRequestException(
          `There was a problem in creating a division deletion log`,
        );

      await this.prismaService.division.delete({ where: { id: divisionId } });

      const deleteDivisionCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DEPARTMENT,
        {
          divisionId,
        },
      );

      await this.cacheManager.del(deleteDivisionCacheKey);

      return {
        message: 'Division deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
