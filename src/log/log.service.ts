import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  findDataById,
  generateCacheKey,
  getPreviousValues,
  handleErrors,
} from 'src/utils/functions';
import { Log } from '@prisma/client';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  EntityType,
  Identifier,
  LogMethod,
  LogType,
  Namespace,
  PaginationDefault,
} from 'src/utils/enums';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Injectable()
export class LogService {
  private logger = new Logger('LogService');
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createLog(createLogDto: CreateLogDto) {
    try {
      const newLog = await this.prismaService.log.create({
        data: { ...createLogDto },
      });

      if (!newLog)
        throw new BadRequestException(
          `There was an error in creating your log.`,
        );

      return {
        message: 'Log created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findLogsBasedOnType(typeId: number, query: FindAllDto) {
    const { offset, limit } = query;

    try {
      const logs = await this.prismaService.log.findMany({
        where: { logTypeId: typeId },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.log.count({
        where: { logTypeId: typeId },
      });

      return {
        message: 'Logs loaded successfully.',
        count,
        logs,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findLogsBasedOnMethod(methodId: number, query: FindAllDto) {
    const { offset, limit } = query;

    try {
      const logs = await this.prismaService.log.findMany({
        where: { logMethodId: methodId },
        skip: offset || PaginationDefault.OFFSET,
        take: limit || PaginationDefault.LIMIT,
      });

      const count = await this.prismaService.log.count({
        where: { logMethodId: methodId },
      });

      return {
        message: 'Logs loaded successfully.',
        count,
        logs,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findLog(logId: number) {
    try {
      const findLogCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.LOG,
        { logId },
      );

      let log: Log;

      const cachedLog: Log = await this.cacheManager.get(findLogCacheKey);

      if (cachedLog) {
        this.logger.debug(`Log with the id ${logId} cache hit.`);
      } else {
        this.logger.debug(`Log with the id ${logId} cache missed.`);

        log = await this.prismaService.log.findFirst({
          where: { id: logId },
        });

        if (!log)
          throw new NotFoundException(`Log with the id ${logId} not found.`);

        await this.cacheManager.set(findLogCacheKey, log);
      }

      return {
        message: 'Log loaded successfully.',
        log,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateLog(logId: number, updateLogDto: UpdateLogDto) {
    try {
      const { editedBy, ...updateData } = updateLogDto;

      const log = await this.prismaService.log.findFirst({
        where: { id: logId },
      });

      if (!log)
        throw new NotFoundException(`Log with the id ${logId} not found.`);

      const updatedLogLog = await this.prismaService.log.create({
        data: {
          logs: getPreviousValues(log, updateData),
          editedBy,
          logMethodId: LogMethod.UPDATE,
          logTypeId: LogMethod.DELETE,
        },
      });

      if (!updatedLogLog)
        throw new BadRequestException(
          `There was a problem in creating a updation log for a log`,
        );

      await this.prismaService.log.update({
        where: { id: logId },
        data: updateData,
      });

      const updateLogCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.LOG,
        { logId },
      );

      await this.cacheManager.set(updateLogCacheKey, { ...log, ...updateData });

      return {
        message: 'Division updated succesfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeLog(logId: number, userId: number) {
    try {
      const log = await this.prismaService.log.findFirst({
        where: { id: logId },
      });

      if (!logId)
        throw new NotFoundException(`Log with the id ${logId} not found.`);

      findDataById(this.prismaService, userId, EntityType.USER);

      const deletedLogLog = await this.prismaService.log.create({
        data: {
          logs: log,
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.DIVISION,
        },
      });

      if (!deletedLogLog)
        throw new BadRequestException(
          `There was a problem in creating a log deletion log`,
        );

      await this.prismaService.log.delete({ where: { id: logId } });

      const deleteLogCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.LOG,
        { logId },
      );

      await this.cacheManager.del(deleteLogCacheKey);

      return {
        message: 'Log deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
