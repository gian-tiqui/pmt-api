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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  findUsers(@Query() query: FindAllDto) {
    return this.userService.findUsers(query);
  }

  @Get(':userId')
  findUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.findUser(userId);
  }

  @Get(':userId/comment')
  findUserComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ) {
    return this.userService.findUserComments(userId, query);
  }

  @Get(':userId/comment/:commentId')
  findUserComment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.userService.findUserComment(userId, commentId);
  }

  @Get(':userId/work')
  findUserWorks(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ) {
    this.userService.findUserWorks(userId, query);
  }

  @Get(':userId/work/:workId')
  findUserWork(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('workId', ParseIntPipe) workId: number,
  ) {
    return this.userService.findUserWork(userId, workId);
  }

  @Get(':userId/task')
  findUserTasks(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ) {
    return this.userService.findUserTasks(userId, query);
  }

  @Get(':userId/task/:taskId')
  findUserTask(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.userService.findUserTask(userId, taskId);
  }

  @Get(':userId/project')
  findUserProjects(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindAllDto,
  ) {
    return this.userService.findUserProjects(userId, query);
  }

  @Get(':userId/project/:projectId')
  findUserProject(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.userService.findUserProject(userId, projectId);
  }

  @Patch(':userId')
  updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(userId, updateUserDto);
  }

  @Delete(':userId')
  removeUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('editedBy', ParseIntPipe) editedBy,
  ) {
    return this.userService.removeUser(userId, editedBy);
  }
}
