import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(createCommentDto);
  }

  @Get()
  findComments(@Query() query: FindAllDto) {
    return this.commentService.findComments(query);
  }

  @Get(':commentId')
  findComment(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.commentService.findComment(commentId);
  }

  @Patch(':commentId')
  updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(+commentId, updateCommentDto);
  }

  @Delete(':commentId')
  removeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('userId') userId: number,
  ) {
    return this.commentService.removeComment(commentId, userId);
  }
}
