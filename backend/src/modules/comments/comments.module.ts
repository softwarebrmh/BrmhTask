import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { TasksModule } from '../tasks/tasks.module';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';

@Module({
  imports: [TasksModule],
  controllers: [CommentsController],
  providers: [CommentsService, TaskAccessGuard],
})
export class CommentsModule {}
