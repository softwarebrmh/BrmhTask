import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { TasksModule } from '../tasks/tasks.module';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';

@Module({
  imports: [TasksModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, TaskAccessGuard],
})
export class AttachmentsModule {}
