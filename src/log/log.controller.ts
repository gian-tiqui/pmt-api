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
} from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  create(@Body() createLogDto: CreateLogDto) {
    return this.logService.createLog(createLogDto);
  }

  @Get()
  findAll(@Query() query: FindAllDto) {
    return this.logService.findLogs(query);
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
