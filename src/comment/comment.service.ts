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
import {
  clearKeys,
  convertMentions,
  filterUsers,
  findDataById,
  generateCacheKey,
  handleErrors,
  sanitizeUser,
} from 'src/utils/functions';
import {
  EntityType,
  Identifier,
  LogMethod,
  LogType,
  PaginationDefault,
} from 'src/utils/enums';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Comment, User } from '@prisma/client';
import {
  CreateComment,
  FindComment,
  FindCommentMentionedUser,
  FindCommentMentionedUsers,
  FindComments,
  RemoveComment,
  UpdateComment,
} from 'src/types/types';

@Injectable()
export class CommentService {
  private logger = new Logger('CommentService');
  private commentCacheKeys: Set<string> = new Set<string>();
  private namespace = 'COMMENT:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
  ): Promise<CreateComment> {
    const { mentions, ...createData } = createCommentDto;

    try {
      await findDataById(
        this.prismaService,
        createData.taskId,
        EntityType.TASK,
      );
      await findDataById(
        this.prismaService,
        createData.userId,
        EntityType.USER,
      );

      const convertedMentions: { userId: number }[] = convertMentions(mentions);

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

      clearKeys(
        this.commentCacheKeys,
        this.cacheManager,
        this.logger,
        'Comment',
      );

      return {
        message: 'Comment created successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findComments(query: FindAllDto): Promise<FindComments> {
    const { search, offset, limit, sortOrder, sortBy } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findCommentsCacheKey = generateCacheKey(
      this.namespace,
      'findComments',
      query,
    );

    try {
      let comments: Comment[], count: number;
      const cachedComments: { comments: Comment[]; count: number } =
        await this.cacheManager.get(findCommentsCacheKey);

      if (cachedComments) {
        this.logger.debug('Comments cache hit.');

        comments = cachedComments.comments;
        count = cachedComments.count;
      } else {
        this.logger.debug('Comments cache missed.');

        const where: object = {
          ...(search && {
            AND: [{ message: { contains: search, mode: 'insensitive' } }],
          }),
        };

        comments = await this.prismaService.comment.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.comment.count({
          where,
        });

        await this.cacheManager.set(findCommentsCacheKey, { comments, count });

        this.commentCacheKeys.add(findCommentsCacheKey);
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

  async findComment(commentId: number): Promise<FindComment> {
    const findCommentCacheKey = generateCacheKey(
      this.namespace,
      Identifier.COMMENT,
      { commentId },
    );

    try {
      let comment: Comment;

      const cachedComment: Comment =
        await this.cacheManager.get(findCommentCacheKey);

      if (cachedComment) {
        this.logger.debug(`Comment with the id ${commentId} cache hit.`);

        comment = cachedComment;
      } else {
        this.logger.debug(`Comment with the id ${commentId} cache missed.`);

        comment = await this.prismaService.comment.findFirst({
          where: { id: commentId },
        });

        await this.cacheManager.set(findCommentCacheKey, comment);
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

  async findCommentMentionedUsers(
    commentId: number,
    query: FindAllDto,
  ): Promise<FindCommentMentionedUsers> {
    const { search, offset, limit, sortBy, sortOrder } = query;
    const findCommentMentionedUsersCacheKey = generateCacheKey(
      this.namespace,
      'findCommentMentionedUsers',
      { ...query, commentId },
    );

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    try {
      let comment: Comment & { mentions: { user: User }[] },
        users: User[],
        count: number;
      const cachedCommentMentionedUsers: { users: User[]; count: number } =
        await this.cacheManager.get(findCommentMentionedUsersCacheKey);

      if (cachedCommentMentionedUsers) {
        this.logger.debug(`Comment users cache hit.`);

        users = cachedCommentMentionedUsers.users;
        count = cachedCommentMentionedUsers.count;
      } else {
        this.logger.debug(`Comment users cache missed.`);

        comment = (await this.prismaService.comment.findFirst({
          where: { id: commentId },
          include: { mentions: { include: { user: true } } },
        })) as Comment & { mentions: { user: User }[] };

        if (!comment)
          throw new NotFoundException(
            `Comment with the id ${commentId} not found.`,
          );

        users = [...comment.mentions.map((mention) => mention.user)];
        count = comment.mentions.length;

        sanitizeUser(users);

        await this.cacheManager.set(findCommentMentionedUsersCacheKey, {
          users,
          count,
        });

        this.commentCacheKeys.add(findCommentMentionedUsersCacheKey);
      }

      return {
        message: 'Mention of the comment retrieved successfully.',
        count,
        users: filterUsers(users, search, offset, limit, orderBy),
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findCommentMentionedUser(
    commentId: number,
    userId: number,
  ): Promise<FindCommentMentionedUser> {
    try {
      const comment: Comment & { mentions: { user: User }[] } =
        await this.prismaService.comment.findFirst({
          where: { id: commentId, mentions: { some: { userId } } },
          include: { mentions: { include: { user: true } } },
        });

      if (!comment)
        throw new NotFoundException(
          `User with the id ${userId} not found in comment ${commentId}`,
        );

      let user: User;
      const cachedCommentMentionedUserCacheKey = generateCacheKey(
        this.namespace,
        Identifier.USER,
        { userId },
      );

      const cachedCommentMentionedUser: User = await this.cacheManager.get(
        cachedCommentMentionedUserCacheKey,
      );

      if (cachedCommentMentionedUser) {
        this.logger.debug(
          `Mentioned User with the id ${userId} in comment ${commentId} cache hit.`,
        );

        user = cachedCommentMentionedUser;
      } else {
        this.logger.debug(
          `Mentioned User with the id ${userId} in comment ${commentId} cache missed.`,
        );

        user = await this.prismaService.user.findFirst({
          where: { id: userId },
        });

        if (!user)
          throw new NotFoundException(
            `User with the id ${userId} not found in comment ${commentId}`,
          );

        sanitizeUser([user]);

        await this.cacheManager.set(cachedCommentMentionedUserCacheKey, user);
      }

      return {
        message: 'Mentioned user of the comment loaded successfully.',
        user,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<UpdateComment> {
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

      const convertedMentions: { userId: number }[] = convertMentions(mentions);

      await this.prismaService.comment.update({
        where: { id: commentId, userId },
        data: { mentions: { create: convertedMentions }, ...updateData },
      });

      const updateCommentCacheKey = generateCacheKey(
        this.namespace,
        Identifier.COMMENT,
        { commentId },
      );

      await this.cacheManager.set(updateCommentCacheKey, {
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

  async removeComment(
    commentId: number,
    userId: number,
  ): Promise<RemoveComment> {
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

      const deleteCommentCacheKey = generateCacheKey(
        this.namespace,
        Identifier.COMMENT,
        { commentId },
      );

      await this.cacheManager.del(deleteCommentCacheKey);

      return {
        message: 'Comment deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
