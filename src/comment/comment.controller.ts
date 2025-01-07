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
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @RateLimit({
    keyPrefix: 'create-comment',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before commenting.',
  })
  @Post()
  createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(createCommentDto);
  }

  @RateLimit({
    keyPrefix: 'get-comments',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before getting the comments.',
  })
  @Get()
  findComments(@Query() query: FindAllDto) {
    return this.commentService.findComments(query);
  }

  @RateLimit({
    keyPrefix: 'get-comment',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before getting a comment.',
  })
  @Get(':commentId')
  findComment(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.commentService.findComment(commentId);
  }

  @RateLimit({
    keyPrefix: 'update-comment',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before updating a comment.',
  })
  @Patch(':commentId')
  updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(commentId, updateCommentDto);
  }

  @RateLimit({
    keyPrefix: 'delete-comment',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before deleting a comment.',
  })
  @Delete(':commentId')
  removeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('userId') userId: number,
  ) {
    return this.commentService.removeComment(commentId, userId);
  }
}
