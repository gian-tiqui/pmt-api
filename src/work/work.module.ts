import { Module } from '@nestjs/common';
import { WorkService } from './work.service';
import { WorkController } from './work.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WorkController],
  providers: [WorkService, PrismaService],
})
export class WorkModule {}
