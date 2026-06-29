import { Module } from '@nestjs/common';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { SprintsRepository } from './sprints.repository';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [SprintsController],
  providers: [SprintsService, SprintsRepository, RolesGuard],
  exports: [SprintsService, SprintsRepository],
})
export class SprintsModule {}
