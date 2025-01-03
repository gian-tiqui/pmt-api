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
