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
import { PaginationDefault } from './enums';

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

export {
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
