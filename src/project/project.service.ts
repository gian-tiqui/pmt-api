import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { internalServerErrorMessage } from 'src/utils/messages';
import { FindAllProjectsDto } from './dto/find-all-project.dto';
import { FindOneWorksDto } from './dto/find-one-works.dto';
import { getPreviousValues } from 'src/utils/functions';
import { DELETE_METHOD_ID, UPDATE_METHOD_ID } from 'src/utils/ids';

const EDIT_TYPE_ID = 3;

@Injectable()
export class ProjectService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      const newProject = await this.prismaService.project.create({
        data: {
          name: createProjectDto.name,
          title: createProjectDto.title,
          authorId: createProjectDto.authorId,
          description: createProjectDto.description,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
          status: '',
        },
      });

      return { message: 'Project created successfully.', project: newProject };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findAll(query: FindAllProjectsDto) {
    const { status, startDate, endDate, authorId, search, limit, offset } =
      query;

    try {
      const options = {
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(authorId && { authorId }),
        ...(search && {
          OR: [
            { name: { contains: search.toLowerCase() } },
            { title: { contains: search.toLowerCase() } },
            { description: { contains: search.toLowerCase() } },
          ],
        }),
      };

      const projects = await this.prismaService.project.findMany({
        where: options,
        skip: offset,
        take: limit,
      });

      const count = await this.prismaService.project.count({
        where: options,
        skip: offset,
        take: limit,
      });

      return { message: 'Projects loaded successfully.', projects, count };
    } catch (error) {
      console.error('Error', error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findOne(id: number) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with the id ${id} not found.`);
      }

      return { message: 'Project loaded successfully.', project };
    } catch (error) {
      console.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  async findWorks(id: number, query: FindOneWorksDto) {
    const { offset, limit, search } = query;
    try {
      const options = {
        ...(search && {
          OR: [
            { name: { contains: search.toLowerCase() } },
            { description: { contains: search.toLowerCase() } },
          ],
        }),
      };

      const project = await this.prismaService.project.findFirst({
        where: { id },
        include: {
          works: {
            where: options,
            skip: offset,
            take: limit,
          },
        },
      });

      if (!project)
        throw new NotFoundException(`Project with the id ${id} not found`);

      const { works } = project;
      const count = works.length;

      return {
        works,
        count,
        message: 'Works of the Project loaded successfully',
      };
    } catch (error) {
      console.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id },
      });

      if (!project)
        throw new NotFoundException(`Project with the id ${id} not found.`);

      const user = await this.prismaService.user.findFirst({
        where: { id: +updateProjectDto.userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${id} not found.`);

      const userId = updateProjectDto.userId;

      delete updateProjectDto.userId;

      const updatedProject = await this.prismaService.project.update({
        where: { id },
        data: { ...updateProjectDto },
      });

      if (!updatedProject)
        throw new ConflictException(
          'There was a problem in updating the project.',
        );

      const updatedProjectLog = await this.prismaService.log.create({
        data: {
          logMethodId: UPDATE_METHOD_ID,
          logTypeId: EDIT_TYPE_ID,
          editedBy: userId,
          logs: getPreviousValues(project, updateProjectDto),
        },
      });

      if (!updatedProjectLog)
        throw new ConflictException(
          'There was a problem in creating a log for the project',
        );

      return { message: `Project updated successfully` };
    } catch (error) {
      console.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async remove(id: number, userId: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(`User with the id ${id} not found`);

      const project = await this.prismaService.project.findFirst({
        where: { id },
      });

      if (!project)
        throw new NotFoundException(`Project with the id ${id} not found.`);

      const deletedProject = await this.prismaService.project.delete({
        where: { id },
      });

      if (!deletedProject)
        throw new ConflictException(
          'There was a problem in deleting the project.',
        );

      const deletedLog = await this.prismaService.log.create({
        data: {
          editedBy: userId,
          logs: project,
          logTypeId: EDIT_TYPE_ID,
          logMethodId: DELETE_METHOD_ID,
        },
      });

      if (!deletedLog)
        throw new UnprocessableEntityException(
          'There was a problem in creating the log.',
        );

      return { message: 'Project deleted successfully.' };
    } catch (error) {
      console.error(error);

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }
}
