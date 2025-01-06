import { Injectable } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private readonly prismaService: PrismaService) {}

  async createLog(createLogDto: CreateLogDto) {}

  async findLogs() {
    return `This action returns all log`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} log`;
  }

  async update(id: number, updateLogDto: UpdateLogDto) {
    return `This action updates a #${id} log`;
  }

  async remove(id: number) {
    return `This action removes a #${id} log`;
  }
}
