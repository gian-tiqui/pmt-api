import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { WorkModule } from './work/work.module';
import { TaskModule } from './task/task.module';
import { SubtaskModule } from './subtask/subtask.module';
import { CommentModule } from './comment/comment.module';
import { UserModule } from './user/user.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    ProjectModule,
    WorkModule,
    TaskModule,
    SubtaskModule,
    CommentModule,
    UserModule,
    DepartmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
