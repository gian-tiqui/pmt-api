import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { MentionController } from './mention.controller';

@Module({
  controllers: [MentionController],
  providers: [MentionService],
})
export class MentionModule {}
