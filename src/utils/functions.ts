import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { internalServerErrorMessage } from './messages';
import { Prisma } from '@prisma/client';

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

export { getPreviousValues, handleErrors };
