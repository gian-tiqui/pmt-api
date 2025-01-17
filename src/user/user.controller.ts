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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllDto } from 'src/project/dto/find-all.dto';
import {
  CreateUser,
  FindUser,
  FindUserComment,
  FindUserComments,
  FindUserProject,
  FindUserProjects,
  FindUsers,
  FindUserTask,
  FindUserTasks,
  FindUserWork,
  FindUserWorks,
  RemoveUser,
  UpdateUser,
} from 'src/types/types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<CreateUser> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  findUsers(@Query() query: FindAllDto): Promise<FindUsers> {
    return this.userService.findUsers(query);
  }

  @Get(':userId')
  findUser(@Param('userId', ParseIntPipe) userId: number): Promise<FindUser> {
    return this.userService.findUser(userId);
  }

  @Get(':userId/comment')
  findUserComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ): Promise<FindUserComments> {
    return this.userService.findUserComments(userId, query);
  }

  @Get(':userId/comment/:commentId')
  findUserComment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<FindUserComment> {
    return this.userService.findUserComment(userId, commentId);
  }

  @Get(':userId/work')
  findUserWorks(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ): Promise<FindUserWorks> {
    return this.userService.findUserWorks(userId, query);
  }

  @Get(':userId/work/:workId')
  findUserWork(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('workId', ParseIntPipe) workId: number,
  ): Promise<FindUserWork> {
    return this.userService.findUserWork(userId, workId);
  }

  @Get(':userId/task')
  findUserTasks(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ): Promise<FindUserTasks> {
    return this.userService.findUserTasks(userId, query);
  }

  @Get(':userId/task/:taskId')
  findUserTask(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<FindUserTask> {
    return this.userService.findUserTask(userId, taskId);
  }

  @Get(':userId/project')
  findUserProjects(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ): Promise<FindUserProjects> {
    return this.userService.findUserProjects(userId, query);
  }

  @Get(':userId/project/:projectId')
  findUserProject(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<FindUserProject> {
    return this.userService.findUserProject(userId, projectId);
  }

  @Patch(':userId')
  updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUser> {
    return this.userService.updateUser(userId, updateUserDto);
  }

  @Delete(':userId')
  removeUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('editedBy', ParseIntPipe) editedBy,
  ): Promise<RemoveUser> {
    return this.userService.removeUser(userId, editedBy);
  }
}
