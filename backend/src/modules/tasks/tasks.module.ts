import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TaskAccessGuard, RolesGuard],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
