import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintQueryDto } from './dto/sprint-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Sprints')
@ApiBearerAuth()
@Controller('projects/:projectId/sprints')
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @Query() query: SprintQueryDto) {
    return this.sprintsService.findAll(projectId, query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.create(projectId, dto, user);
  }

  @Get(':sprintId')
  findOne(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return this.sprintsService.findOne(projectId, sprintId);
  }

  @Patch(':sprintId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.update(projectId, sprintId, dto, user);
  }

  @Patch(':sprintId/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  start(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.start(projectId, sprintId, user);
  }

  @Patch(':sprintId/end')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  end(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.end(projectId, sprintId, user);
  }
}
