import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPreviousValues, handleErrors } from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';

@Injectable()
export class DepartmentService {
  private logger = new Logger('DepartmentService');
  constructor(private readonly prismaService: PrismaService) {}

  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    try {
      await this.prismaService.department.create({
        data: {
          ...createDepartmentDto,
        },
      });

      return { message: 'Department created successfully.' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartments(query: FindAllDto) {
    const { search, offset, limit, sortBy, sortOrder } = query;

    try {
      const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

      const departments = await this.prismaService.department.findMany({
        where: {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy,
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.department.count({
        where: {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
      });

      return {
        message: 'Departments loaded successfully',
        count,
        departments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDepartment(deptId: number) {
    try {
      const department = await this.prismaService.department.findFirst({
        where: { id: deptId },
      });

      if (!department)
        throw new NotFoundException(
          `Department with the id ${deptId} not found.`,
        );

      return { message: 'Department loaded successfully', department };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateDepartment(
    deptId: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const { userId, ...updateData } = updateDepartmentDto;
    try {
      const department = await this.prismaService.department.findFirst({
        where: { id: deptId },
      });

      if (!department)
        throw new NotFoundException(`Department with the ${deptId} not found.`);

      const updatedData = await this.prismaService.department.update({
        where: { id: deptId },
        data: { ...updateData },
      });

      if (!updatedData)
        throw new BadRequestException(
          'There was a problem in updating the department',
        );

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

      return { message: 'Department deleted successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeDepartment(deptId: number, userId: number) {
    try {
      const department = await this.prismaService.department.findFirst({
        where: { id: deptId },
      });

      if (!department)
        throw new NotFoundException(
          `Department with the id ${deptId} not found.`,
        );

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

      return {
        message: 'Department deleted successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
