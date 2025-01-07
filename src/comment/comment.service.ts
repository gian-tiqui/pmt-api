import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleErrors } from 'src/utils/functions';
import { LogMethod, LogType, PaginationDefault } from 'src/utils/enums';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentService {
  private logger = new Logger('CommentService');

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async createComment(createCommentDto: CreateCommentDto) {
    const { mentions, ...createData } = createCommentDto;

    try {
      const convertedMentions = mentions
        .split(',')
        .map((id) => ({ userId: +id }));
      const newComment = await this.prismaService.comment.create({
        data: {
          ...createData,
          mentions: {
            create: convertedMentions,
          },
        },
      });

      if (!newComment)
        throw new BadRequestException(
          `There was a problem in creating the comment.`,
        );

      return {
        message: 'Comment created successfully.',
        comment: newComment,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findComments(query: FindAllDto) {
    const { search, offset, limit, sortOrder, sortBy } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const queryString: string = JSON.stringify(query);
    try {
      let comments;
      let count;

      const cachedComments: { comments: Comment[]; count: number } =
        await this.cache.get(queryString);

      if (cachedComments) {
        comments = cachedComments.comments;
        count = cachedComments.count;
      } else {
        comments = await this.prismaService.comment.findMany({
          where: {
            ...(search && {
              AND: [{ message: { contains: search, mode: 'insensitive' } }],
            }),
          },

          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.comment.count({
          where: {
            ...(search && {
              AND: [{ message: { contains: search, mode: 'insensitive' } }],
            }),
          },
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });
      }

      await this.cache.set(queryString, { comments, count }, 300);

      return {
        message: 'Comments of the user loaded successfully',
        comments,
        count,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findComment(commentId: number) {
    try {
      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId },
      });

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} not found.`,
        );

      return {
        message: 'Comment loaded successfully',
        comment,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateComment(commentId: number, updateCommentDto: UpdateCommentDto) {
    const { userId, mentions, ...updateData } = updateCommentDto;

    try {
      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId, userId },
      });

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} not found in user ${userId}`,
        );

      const updatedCommentLog = await this.prismaService.log.create({
        data: {
          logs: comment,
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.COMMENT,
        },
      });

      if (!updatedCommentLog)
        throw new BadRequestException(`There was a problem in creating a log.`);

      const convertedMentions = mentions
        .split(',')
        .map((id) => ({ userId: +id }));

      await this.prismaService.comment.update({
        where: { id: commentId, userId },
        data: { mentions: { create: convertedMentions }, ...updateData },
      });

      return {
        message: 'Comment deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeComment(commentId: number, userId: number) {
    try {
      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId, userId },
      });

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} not found in user ${userId}`,
        );

      const deletedCommentLog = await this.prismaService.log.create({
        data: {
          logs: comment,
          editedBy: userId,
          logMethodId: LogMethod.DELETE,
          logTypeId: LogType.COMMENT,
        },
      });

      if (!deletedCommentLog)
        throw new BadRequestException(`There was a problem in creating a log.`);

      await this.prismaService.comment.delete({
        where: { id: commentId, userId },
      });

      return {
        message: 'Comment deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
