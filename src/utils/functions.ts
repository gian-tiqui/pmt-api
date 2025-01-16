import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { internalServerErrorMessage } from './messages';
import { Prisma, Project, Task, User, Work } from '@prisma/client';
import { CreateWorkDto } from 'src/work/dto/create-work.dto';
import { UpdateWorkDto } from 'src/work/dto/update-work.dto';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { UpdateTaskDto } from 'src/task/dto/update-task.dto';
import { EntityType, PaginationDefault } from './enums';
import { Cache } from '@nestjs/cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

const getPreviousValues = (original, updates) => {
  const changes = {};

  for (const key in updates) {
    if (original.hasOwnProperty(key) && updates[key] !== original[key]) {
      changes[key] = original[key];
    }
  }

  return changes;
};

const handleErrors = (error: any, logger: Logger, customMessage?: string) => {
  logger.error(error.message, error.stack);

  if (
    error instanceof NotFoundException ||
    error instanceof BadRequestException
  ) {
    throw error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const targetField = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(', ')
        : 'field';
      throw new BadRequestException(`Duplicate value for ${targetField}.`);
    }

    if (error.code === 'P2025') {
      throw new NotFoundException('The requested resource could not be found.');
    }
  }

  const message = customMessage || internalServerErrorMessage;
  throw new InternalServerErrorException(message);
};

const firstDateGreaterThanSecondDate = (
  startDate: Date,
  endDate: Date,
  name: string,
  secondName?: string,
) => {
  if (startDate >= endDate) {
    throw new BadRequestException(
      `${name} end date must be strictly later than start date ${secondName && `of ${secondName}`}.`,
    );
  }
};

const validateParentAndChildDates = (
  child:
    | Project
    | Work
    | Task
    | CreateWorkDto
    | UpdateWorkDto
    | CreateTaskDto
    | UpdateTaskDto,
  parent:
    | Project
    | Work
    | Task
    | CreateWorkDto
    | UpdateWorkDto
    | CreateTaskDto
    | UpdateTaskDto,
  childType: string,
  parentType: string,
) => {
  if (parent.startDate > child.startDate)
    throw new BadRequestException(
      `Start date of a ${childType} must be later or same as the start date of the ${parentType}.`,
    );

  if (parent.endDate < child.endDate)
    throw new BadRequestException(
      `End date of the ${childType} must not be later than the ${parentType}`,
    );
};

const filterUsers = (
  users: User[],
  search: string,
  offset: number,
  limit: number,
  orderBy: any,
): User[] => {
  let filteredUsers = users;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      ['firstName', 'middleName', 'lastName'].some((field) =>
        user[field]?.toString().toLowerCase().includes(lowerSearch),
      ),
    );
  }

  if (orderBy) {
    const [sortField, sortOrder] = Object.entries(orderBy)[0];
    filteredUsers = filteredUsers.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const start = offset || PaginationDefault.OFFSET;
  const end = limit ? start + limit : PaginationDefault.LIMIT;

  return filteredUsers.slice(start, end);
};

const validateProjectDepth = (project: Project, works: Work[]) => {};

const validateWorkDepth = (work: Work, task: Task[]) => {};

const validateTaskDepth = (task: Task, subTasks: Task[]) => {};

const generateCacheKey = (
  namespace: string,
  identifier: string | number,
  query?: object,
): string => {
  return `${namespace}${identifier}${query ? `-${JSON.stringify(query)}` : ''}`;
};

const clearKeys = async (
  keys: Set<string>,
  cacheManager: Cache,
  logger: Logger,
  identifier: string,
) => {
  if (keys.size > 0) {
    try {
      await Promise.all(Array.from(keys).map((key) => cacheManager.del(key)));

      keys.clear();

      logger.verbose(`${identifier} find all cache cleared.`);
    } catch (error) {
      handleErrors(error, logger);
    }
  }
};

const sanitizeUser = (users: User[]) => {
  users.map((user) => {
    delete user.password;
    delete user.refreshToken;
  });
};

const findDataById = async (
  prismaService: PrismaService,
  id: number,
  entityType: number,
) => {
  switch (entityType) {
    case EntityType.COMMENT:
      const comment = await prismaService.comment.findFirst({ where: { id } });

      if (!comment)
        throw new NotFoundException(`Comment with the ${id} not found.`);
      break;
    case EntityType.DEPARTMENT:
      const department = await prismaService.department.findFirst({
        where: { id },
      });

      if (!department)
        throw new NotFoundException(`Department with the ${id} not found.`);

      break;
    case EntityType.DIVISION:
      const division = await prismaService.division.findFirst({
        where: { id },
      });

      if (!division)
        throw new NotFoundException(`Division with the ${id} not found.`);
      break;
    case EntityType.PROJECT:
      const project = await prismaService.project.findFirst({ where: { id } });

      if (!project)
        throw new NotFoundException(`Project with the ${id} not found.`);
      break;
    case EntityType.TASK:
      const task = await prismaService.task.findFirst({ where: { id } });

      if (!task) throw new NotFoundException(`Task with the ${id} not found.`);
      break;
    case EntityType.USER:
      const user = await prismaService.user.findFirst({ where: { id } });

      if (!user) throw new NotFoundException(`User with the ${id} not found.`);
      break;
    case EntityType.WORK:
      const work = await prismaService.work.findFirst({ where: { id } });

      if (!work) throw new NotFoundException(`Work with the ${id} not found.`);
      break;
  }
};

const convertMentions = (mentionsString: string) => {
  if (mentionsString) {
    return mentionsString.split(',').map((id) => {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId))
        throw new BadRequestException(`Invalid mention ID: ${id}`);
      return { userId: parsedId };
    });
  }
};

export {
  convertMentions,
  findDataById,
  sanitizeUser,
  clearKeys,
  generateCacheKey,
  getPreviousValues,
  handleErrors,
  firstDateGreaterThanSecondDate,
  validateParentAndChildDates,
  filterUsers,
  validateProjectDepth,
  validateWorkDepth,
  validateTaskDepth,
};
