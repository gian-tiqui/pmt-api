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
import { Comment, Mention } from '@prisma/client';

@Injectable()
export class CommentService {
  private logger = new Logger('CommentService');
  private commentCacheKeys: string[] = [];
  private namespace = 'COMMENT:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createComment(createCommentDto: CreateCommentDto) {
    const { mentions, ...createData } = createCommentDto;

    try {
      const task = await this.prismaService.task.findFirst({
        where: { id: createCommentDto.taskId },
      });

      if (!task)
        throw new NotFoundException(
          `Task with the id ${createCommentDto.taskId} not found`,
        );

      let convertedMentions: { userId: number }[];

      if (mentions)
        convertedMentions = mentions.split(',').map((id) => ({ userId: +id }));

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

      if (this.commentCacheKeys.length > 0) {
        try {
          await Promise.all(
            this.commentCacheKeys.map((key) => this.cacheManager.del(key)),
          );

          this.commentCacheKeys = [];
        } catch (error) {
          handleErrors(error, this.logger);
        }
      }

      return {
        message: 'Comment created successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findComments(query: FindAllDto) {
    const { search, offset, limit, sortOrder, sortBy } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const commentsCacheKey = `${this.namespace}${JSON.stringify(query)}`;
    try {
      let comments;
      let count;
      const cachedComments: { comments: Comment[]; count: number } =
        await this.cacheManager.get(commentsCacheKey);

      if (cachedComments) {
        this.logger.debug('Cache hit.');
        comments = cachedComments.comments;
        count = cachedComments.count;
      } else {
        this.logger.debug('Cache missed.');
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
        });

        await this.cacheManager.set(commentsCacheKey, { comments, count });

        this.commentCacheKeys.push(commentsCacheKey);
      }

      return {
        message: 'Comments of the user loaded successfully',
        count,
        comments,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findComment(commentId: number) {
    const commentCacheKey = `comment-${commentId}`;
    try {
      let comment: Comment;

      const cachedComment: Comment =
        await this.cacheManager.get(commentCacheKey);

      if (cachedComment) {
        this.logger.debug('Cache hit.');
        comment = cachedComment;
      } else {
        this.logger.debug('Cache missed.');
        comment = await this.prismaService.comment.findFirst({
          where: { id: commentId },
        });

        await this.cacheManager.set(commentCacheKey, comment);
      }

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

  async findCommentMentions(commentId: number, query: FindAllDto) {
    const { search, offset, limit, sortBy, sortOrder } = query;
    const commentMentionCacheKey = `${this.namespace}comment${commentId}-${JSON.stringify(query)}`;

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      const comment = await this.prismaService.comment.findFirst({
        where: { id: commentId },
      });

      if (!comment)
        throw new NotFoundException(
          `Comment with the id ${commentId} not found.`,
        );

      let mentions;
      let count;
      const cachedMentions: { mentions: Mention[]; count: number } =
        await this.cacheManager.get(commentMentionCacheKey);

      if (cachedMentions) {
        this.logger.debug(`Cache hit.`);
        mentions = cachedMentions.mentions;
        count = cachedMentions.count;
      } else {
        this.logger.debug(`Cache missed.`);
        mentions = await this.prismaService.mention.findMany({
          where: {
            commentId,
            user: search
              ? {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : undefined,
          },
          select: { user: true },
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.mention.count({
          where: {
            commentId,
            user: search
              ? {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : undefined,
          },
        });

        await this.cacheManager.set(commentMentionCacheKey, {
          mentions,
          count,
        });

        this.commentCacheKeys.push(commentMentionCacheKey);
      }

      return {
        message: 'Mention of the comment retrieved successfully.',
        count,
        mentions,
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

      let convertedMentions: { userId: number }[];

      if (mentions)
        convertedMentions =
          mentions.split(',').map((id) => ({ userId: +id })) || undefined;

      await this.prismaService.comment.update({
        where: { id: commentId, userId },
        data: { mentions: { create: convertedMentions }, ...updateData },
      });

      this.cacheManager.set(`comment-${comment.id}`, {
        ...comment,
        ...updateData,
      });

      return {
        message: 'Comment updated successfully.',
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

      await this.cacheManager.del(`comment-${comment.id}`);

      return {
        message: 'Comment deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
