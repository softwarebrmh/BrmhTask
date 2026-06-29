import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { ReorderStepsDto } from './dto/reorder-steps.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Steps')
@ApiBearerAuth()
@Controller('tasks/:taskId/steps')
export class StepsController {
  constructor(private stepsService: StepsService) {}

  @Get()
  @UseGuards(TaskAccessGuard)
  findAll(@Param('taskId') taskId: string) {
    return this.stepsService.findAll(taskId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateStepDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stepsService.create(taskId, dto, user);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  reorder(@Param('taskId') taskId: string, @Body() dto: ReorderStepsDto) {
    return this.stepsService.reorder(taskId, dto);
  }

  @Delete(':stepId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('taskId') taskId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stepsService.remove(taskId, stepId, user);
  }

  @Patch(':stepId/check')
  @UseGuards(TaskAccessGuard)
  check(
    @Param('taskId') taskId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stepsService.check(taskId, stepId, user.sub, user);
  }

  @Patch(':stepId/uncheck')
  @UseGuards(TaskAccessGuard)
  uncheck(
    @Param('taskId') taskId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stepsService.uncheck(taskId, stepId, user);
  }
}
