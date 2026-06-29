import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('companies/:companyId/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(
    @Param('companyId') companyId: string,
    @Query() query: ProjectQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findAll(companyId, user, query);
  }

  @Post()
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.create(companyId, dto, user);
  }

  @Get(':projectId')
  findOne(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findOne(companyId, projectId, user);
  }

  @Patch(':projectId')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(companyId, projectId, dto, user);
  }

  @Delete(':projectId')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  archive(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.archive(companyId, projectId, user);
  }

  @Get(':projectId/members')
  getMembers(@Param('projectId') projectId: string) {
    return this.projectsService.getMembers(projectId);
  }

  @Post(':projectId/members')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  addMember(
    @Param('projectId') projectId: string,
    @Body() body: { userId: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.addMember(projectId, body.userId, user);
  }

  @Delete(':projectId/members/:userId')
  @UseGuards(RolesGuard, CompanyOwnerGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(projectId, userId);
  }
}
