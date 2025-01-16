import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  handleErrors,
  findDataById,
  generateCacheKey,
} from 'src/utils/functions';
import {
  CreateDivision,
  FindDivision,
  FindDivisionDepartment,
  FindDivisionDepartments,
  FindDivisions,
  FindDivisionUser,
  FindDivisionUsers,
  RemoveDivision,
} from 'src/types/types';
import {
  EntityType,
  Identifier,
  Namespace,
  PaginationDefault,
} from 'src/utils/enums';
import { Division } from '@prisma/client';

@Injectable()
export class DivisionService {
  private logger: Logger = new Logger('DivisionService');
  private divisionCacheKeys: Set<string> = new Set<string>();
  private namespace = 'DIVISION:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createDivision(
    createDivisionDto: CreateDivisionDto,
  ): Promise<CreateDivision> {
    const { userId, ...data } = createDivisionDto;
    try {
      findDataById(this.prismaService, userId, EntityType.USER);

      await this.prismaService.division.create({ data });

      return {
        message: 'Division created successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisions(query: FindAllDto): Promise<FindDivisions> {
    const { search, offset, limit, sortBy, sortOrder } = query;
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;
    const findDivisionsCacheKey: string = generateCacheKey(
      this.namespace,
      'findDivisions',
      query,
    );

    try {
      let divisions: Division[], count: number;

      const cachedDivisions: { divisions: Division[]; count: number } =
        await this.cacheManager.get(findDivisionsCacheKey);

      if (cachedDivisions) {
        this.logger.debug(`Divisions cache hit.`);

        divisions = cachedDivisions.divisions;
        count = cachedDivisions.count;
      } else {
        this.logger.debug(`Divisions cache missed.`);

        const where: object = {
          ...(search && {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };

        divisions = await this.prismaService.division.findMany({
          where,
          orderBy,
          skip: offset || PaginationDefault.OFFSET,
          take: limit || PaginationDefault.LIMIT,
        });

        count = await this.prismaService.division.count({
          where,
        });

        await this.cacheManager.set(findDivisionsCacheKey, {
          divisions,
          count,
        });

        this.divisionCacheKeys.add(findDivisionsCacheKey);
      }

      return {
        message: 'Divisions loaded successfully.',
        count,
        divisions,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivision(divisionId: number): Promise<FindDivision> {
    try {
      const findDivisionCacheKey: string = generateCacheKey(
        Namespace.GENERAL,
        Identifier.DIVISION,
        { divisionId },
      );
      let division: Division;
      const cachedDivision: Division =
        await this.cacheManager.get(findDivisionCacheKey);

      if (cachedDivision) {
        this.logger.debug(`Division with the id ${divisionId} hit.`);

        division = cachedDivision;
      } else {
        this.logger.debug(`Division with the id ${divisionId} cache missed.`);

        division = await this.prismaService.division.findFirst({
          where: { id: divisionId },
        });

        await this.cacheManager.set(findDivisionCacheKey, division);
      }

      return {
        message: 'Division loaded successfully.',
        division,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async findDivisionUsers(): Promise<FindDivisionUsers> {}

  async findDivisionUser(): Promise<FindDivisionUser> {}

  async findDivisionDepartments(): Promise<FindDivisionDepartments> {}

  async findDivisionDepartment(): Promise<FindDivisionDepartment> {}

  async updateDivision(
    divisionId: number,
    updateDivisionDto: UpdateDivisionDto,
  ) {
    try {
      return {
        message: 'Division updated successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async removeDivision(
    divisionId: number,
    userId: number,
  ): Promise<RemoveDivision> {
    try {
      return {
        message: 'Division deleted successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }
}
