import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MentionService } from './mention.service';
import { CreateMentionDto } from './dto/create-mention.dto';
import { UpdateMentionDto } from './dto/update-mention.dto';

@Controller('mention')
export class MentionController {
  constructor(private readonly mentionService: MentionService) {}

  @Post()
  create(@Body() createMentionDto: CreateMentionDto) {
    return this.mentionService.create(createMentionDto);
  }

  @Get()
  findAll() {
    return this.mentionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mentionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMentionDto: UpdateMentionDto) {
    return this.mentionService.update(+id, updateMentionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mentionService.remove(+id);
  }
}
