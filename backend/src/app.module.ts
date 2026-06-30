import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyModule } from './modules/company/company.module';
import { StaffModule } from './modules/staff/staff.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StepsModule } from './modules/steps/steps.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { NotesModule } from './modules/notes/notes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CompanyModule,
    StaffModule,
    ProjectsModule,
    SprintsModule,
    TasksModule,
    StepsModule,
    AttachmentsModule,
    NotesModule,
    CommentsModule,
    DashboardModule,
    HealthModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
