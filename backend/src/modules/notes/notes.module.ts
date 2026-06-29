import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { TasksModule } from '../tasks/tasks.module';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';

@Module({
  imports: [TasksModule],
  controllers: [NotesController],
  providers: [NotesService, TaskAccessGuard],
})
export class NotesModule {}
