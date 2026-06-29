import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, CompanyOwnerGuard, RolesGuard],
})
export class DashboardModule {}
