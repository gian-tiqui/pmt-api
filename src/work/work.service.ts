import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleErrors } from 'src/utils/functions';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Injectable()
export class WorkService {
  private logger = new Logger('WorkService');

  constructor(private readonly prismaService: PrismaService) {}

  async createWork(createWorkDto: CreateWorkDto) {
    try {
      await this.prismaService.work.create({
        data: {
          ...createWorkDto,
        },
      });

      return {
        message: 'Work created successfully',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findWorks(query: FindAllDto) {
    const {
      search,
      offset,
      limit,
      authorId,
      type,
      status,
      startDate,
      endDate,
    } = query;
    return `This action returns all work`;
  }

  async findWork(workId: number) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found.`);

      return {
        message: 'Work loaded successfully.',
        work,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateWork(workId: number, updateWorkDto: UpdateWorkDto) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new BadRequestException(`Work witht he id ${workId} not found.`);

      await this.prismaService.work.update({
        where: { id: workId },
        data: {
          ...updateWorkDto,
        },
      });

      return { message: 'Work updated successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeWork(workId: number) {
    try {
      const work = await this.prismaService.work.findFirst({
        where: { id: workId },
      });

      if (!work)
        throw new NotFoundException(`Work with the id ${workId} not found.`);

      await this.prismaService.work.delete({ where: { id: workId } });

      return { message: 'Work deleted successfully' };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
