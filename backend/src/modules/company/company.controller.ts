import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Public()
  @Get('lookup/:code')
  lookup(@Param('code') code: string) {
    return this.companyService.lookupByCode(code);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: JwtPayload) {
    return this.companyService.create(dto, user);
  }

  @Get(':companyId')
  findOne(@Param('companyId') companyId: string, @CurrentUser() user: JwtPayload) {
    return this.companyService.findOne(companyId, user);
  }

  @Post(':companyId/tasks')
  createTask(
    @Param('companyId') companyId: string,
    @Body() dto: { name: string; description?: string; priority?: string; assigneeIds?: string[]; startDate?: string; plannedDueDate?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companyService.createTask(companyId, dto, user);
  }

  @Get(':companyId/tasks')
  getAllTasks(
    @Param('companyId') companyId: string,
    @Query() query: { status?: string; priority?: string; search?: string; assigneeId?: string; page?: string; limit?: string },
  ) {
    return this.companyService.getAllTasks(companyId, {
      ...query,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Patch(':companyId')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.OWNER)
  update(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companyService.update(companyId, dto, user);
  }
}
