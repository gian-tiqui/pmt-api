import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  create(@Body() createLogDto: CreateLogDto) {
    return this.logService.createLog(createLogDto);
  }

  @Get(':typeId/log-types')
  findLogsBasedOnType(
    @Param('typeId', ParseIntPipe) typeId: number,
    @Query() query: FindAllDto,
  ) {
    return this.logService.findLogsBasedOnType(typeId, query);
  }

  @Get(':methodId/log-method')
  findLogsBasedOnMethod(
    @Param('methodId', ParseIntPipe) methodId: number,
    @Query() query: FindAllDto,
  ) {
    return this.logService.findLogsBasedOnMethod(methodId, query);
  }

  @Get(':logId')
  findOne(@Param('logId', ParseIntPipe) logId: number) {
    return this.logService.findLog(logId);
  }

  @Patch(':logId')
  update(
    @Param('logId', ParseIntPipe) logId: number,
    @Body() updateLogDto: UpdateLogDto,
  ) {
    return this.logService.updateLog(logId, updateLogDto);
  }

  @Delete(':logId')
  remove(
    @Param('logId', ParseIntPipe) logId: number,
    @Query('userId') userId: number,
  ) {
    return this.logService.removeLog(logId, userId);
  }
}
