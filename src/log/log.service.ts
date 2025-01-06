import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleErrors } from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Injectable()
export class LogService {
  private logger = new Logger('LogService');
  constructor(private readonly prismaService: PrismaService) {}

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

  async findLogs(query: FindAllDto) {}

  async findLog(logId: number) {
    try {
      const log = await this.prismaService.log.findFirst({
        where: { id: logId },
      });

      if (!log)
        throw new NotFoundException(`Log with the id ${logId} not found.`);

      return {
        message: 'Log loaded successfully.',
        log,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateLog(logId: number, updateLogDto: UpdateLogDto) {
    return `This action updates a #${logId} log`;
  }

  async removeLog(logId: number, userId: number) {
    return `This action removes a #${logId} log`;
  }
}
