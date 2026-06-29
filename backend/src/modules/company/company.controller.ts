import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

@ApiTags('Company')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: JwtPayload) {
    return this.companyService.create(dto, user);
  }

  @Get(':companyId')
  findOne(@Param('companyId') companyId: string, @CurrentUser() user: JwtPayload) {
    return this.companyService.findOne(companyId, user);
  }

  @Patch(':companyId')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companyService.update(companyId, dto, user);
  }
}
