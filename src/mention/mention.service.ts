import { Injectable } from '@nestjs/common';
import { CreateMentionDto } from './dto/create-mention.dto';
import { UpdateMentionDto } from './dto/update-mention.dto';

@Injectable()
export class MentionService {
  create(createMentionDto: CreateMentionDto) {
    return 'This action adds a new mention';
  }

  findAll() {
    return `This action returns all mention`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mention`;
  }

  update(id: number, updateMentionDto: UpdateMentionDto) {
    return `This action updates a #${id} mention`;
  }

  remove(id: number) {
    return `This action removes a #${id} mention`;
  }
}
