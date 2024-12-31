import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { internalServerErrorMessage } from 'src/utils/messages';

@Injectable()
export class WorkService {
  private logger = new Logger('WorkService');

  constructor(private readonly prismaService: PrismaService) {}

  async createWork(createWorkDto: CreateWorkDto) {
    try {
      const newWork = await this.prismaService.work.create({
        data: {
          ...createWorkDto,
        },
      });

      return {
        message: 'Work created successfully',
        newWork,
      };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findWorks() {
    return `This action returns all work`;
  }

  async findWork(workId: number) {
    try {
    } catch (error) {
      this.logger.error(error);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async updateWork(workId: number, updateWorkDto: UpdateWorkDto) {
    return `This action updates a #${workId} work`;
  }

  async removeWork(workId: number) {
    return `This action removes a #${workId} work`;
  }
}
