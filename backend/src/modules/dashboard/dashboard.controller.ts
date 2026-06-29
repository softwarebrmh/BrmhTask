import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin/:companyId')
  @UseGuards(CompanyOwnerGuard)
  getAdminDashboard(@Param('companyId') companyId: string) {
    return this.dashboardService.getAdminDashboard(companyId);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  getStaffDashboard(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getStaffDashboard(user);
  }

  @Get('projects/:projectId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getProjectSummary(@Param('projectId') projectId: string) {
    return this.dashboardService.getProjectSummary(projectId);
  }
}
