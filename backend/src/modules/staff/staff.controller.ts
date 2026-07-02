import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(RolesGuard, CompanyOwnerGuard)
@Roles(UserRole.OWNER)
@Controller('companies/:companyId/staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll(@Param('companyId') companyId: string, @Query() query: StaffQueryDto) {
    return this.staffService.findAll(companyId, query);
  }

  @Post()
  invite(
    @Param('companyId') companyId: string,
    @Body() dto: InviteStaffDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.invite(companyId, dto, user);
  }

  @Get(':staffId')
  findOne(@Param('companyId') companyId: string, @Param('staffId') staffId: string) {
    return this.staffService.findOne(companyId, staffId);
  }

  @Patch(':staffId')
  update(
    @Param('companyId') companyId: string,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(companyId, staffId, dto);
  }

  @Patch(':staffId/suspend')
  suspend(
    @Param('companyId') companyId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.suspend(companyId, staffId, user);
  }

  @Patch(':staffId/activate')
  activate(
    @Param('companyId') companyId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.activate(companyId, staffId, user);
  }

  @Post(':staffId/resend-invite')
  resendInvite(
    @Param('companyId') companyId: string,
    @Param('staffId') staffId: string,
  ) {
    return this.staffService.resendInvite(companyId, staffId);
  }
}
