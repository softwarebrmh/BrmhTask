import { Module } from '@nestjs/common';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { TasksModule } from '../tasks/tasks.module';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TasksModule],
  controllers: [StepsController],
  providers: [StepsService, TaskAccessGuard, RolesGuard],
})
export class StepsModule {}
