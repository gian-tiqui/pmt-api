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
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import {
  CreateComment,
  FindComment,
  FindCommentMentionedUser,
  FindCommentMentionedUsers,
  FindComments,
  RemoveComment,
} from 'src/types/types';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
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
  createComment(
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CreateComment> {
    return this.commentService.createComment(createCommentDto);
  }

  @RateLimit({
    keyPrefix: 'get-comments',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before getting the comments.',
  })
  @Get()
  findComments(@Query() query: FindAllDto): Promise<FindComments> {
    return this.commentService.findComments(query);
  }

  @RateLimit({
    keyPrefix: 'get-comment',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before getting a comment.',
  })
  @Get(':commentId')
  findComment(
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<FindComment> {
    return this.commentService.findComment(commentId);
  }

  @RateLimit({
    keyPrefix: 'get-comment-mentions',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before getting a comment.',
  })
  @Get(':commentId/mention')
  findCommentMentionedUsers(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() query: FindAllDto,
  ): Promise<FindCommentMentionedUsers> {
    return this.commentService.findCommentMentionedUsers(commentId, query);
  }

  @RateLimit({
    keyPrefix: 'get-comment-mention',
    points: 10,
    duration: 60,
    errorMessage: `Please wait before getting a comment's mentioned user`,
  })
  @Get(':commentId/mention/:userId')
  findCommentMentionedUser(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FindCommentMentionedUser> {
    return this.commentService.findCommentMentionedUser(commentId, userId);
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
  ): Promise<UpdateCommentDto> {
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
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<RemoveComment> {
    return this.commentService.removeComment(commentId, userId);
  }
}
