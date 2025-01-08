import { Module } from '@nestjs/common';
import { DivisionService } from './division.service';
import { DivisionController } from './division.controller';

@Module({
  controllers: [DivisionController],
  providers: [DivisionService],
})
export class DivisionModule {}
