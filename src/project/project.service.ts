import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { internalServerErrorMessage } from 'src/utils/messages';

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
          createdAt: new Date(),
          updatedAt: new Date(),
          status: '',
        },
      });

      return { message: 'Project created successfully', project: newProject };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async findAll(
    name: string,
    status: string,
    startDate: Date,
    endDate: Date,
    title: string,
    description: string,
    authorId: number,
    search: string,
    offset: number,
    limit: number,
  ) {
    try {
      const options = {
        ...(name && { name: name }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(title && { title }),
        ...(description && { description }),
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

      if (projects.length === 0)
        return { message: 'There are no projects yet.', statusCode: 200 };

      return { message: 'Projects loaded successfully', projects, count };
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

      if (!project)
        throw new NotFoundException(`Project with the id ${id} not found`);

      return { message: 'Project loaded successfully', project };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  async remove(id: number, userId: number) {
    try {
      const project = await this.prismaService.project.findFirst({
        where: { id },
      });

      if (!project)
        throw new NotFoundException(`Project with the id ${id} not found`);

      const deletedProject = await this.prismaService.project.delete({
        where: { id },
      });

      if (!deletedProject)
        throw new ConflictException(
          'There was a problem in deleting the project',
        );

      // continue this next week make the code clean

      // this.prismaService.editLogs.create({
      //   data: {
      //     editedBy: userId,
      //   },
      // });

      return { message: 'Project deleted successfully' };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(internalServerErrorMessage);
    }
  }
}
