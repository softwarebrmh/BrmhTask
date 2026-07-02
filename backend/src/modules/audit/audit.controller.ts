import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('tasks/:taskId/audit')
  @UseGuards(TaskAccessGuard)
  findByTask(@Param('taskId') taskId: string, @Query() query: AuditQueryDto) {
    return this.auditService.findByTask(taskId, query);
  }

  @Get('companies/:companyId/audit')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.OWNER)
  findByCompany(@Param('companyId') companyId: string, @Query() query: AuditQueryDto) {
    return this.auditService.findByCompany(companyId, query);
  }
}
