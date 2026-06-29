import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, RolesGuard, CompanyOwnerGuard],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
