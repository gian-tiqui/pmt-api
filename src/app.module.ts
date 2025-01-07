import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { WorkModule } from './work/work.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { UserModule } from './user/user.module';
import { DepartmentModule } from './department/department.module';
import { ConfigModule } from '@nestjs/config';
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter';
import { APP_GUARD } from '@nestjs/core';
import { LogModule } from './log/log.module';
import { AuthModule } from './auth/auth.module';
import { MentionModule } from './mention/mention.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 5,
      max: 100,
    }),
    RateLimiterModule,
    ProjectModule,
    WorkModule,
    TaskModule,
    CommentModule,
    UserModule,
    DepartmentModule,
    ConfigModule.forRoot({ isGlobal: true }),
    LogModule,
    AuthModule,
    MentionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}
