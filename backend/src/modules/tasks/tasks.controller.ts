import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskEffortDto } from './dto/update-task-effort.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('sprints/:sprintId/tasks')
  findAll(
    @Param('sprintId') sprintId: string,
    @Query() query: TaskQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findAll(sprintId, user, query);
  }

  @Post('sprints/:sprintId/tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Param('sprintId') sprintId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.create(sprintId, dto, user);
  }

  @Get('tasks/:taskId')
  @UseGuards(TaskAccessGuard)
  findOne(@Param('taskId') taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  @Patch('tasks/:taskId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(taskId, dto, user);
  }

  @Delete('tasks/:taskId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.remove(taskId, user);
  }

  @Patch('tasks/:taskId/status')
  @UseGuards(TaskAccessGuard)
  updateStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.updateStatus(taskId, dto, user);
  }

  @Patch('tasks/:taskId/effort')
  @UseGuards(TaskAccessGuard)
  updateEffort(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskEffortDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.updateEffort(taskId, dto, user);
  }

  @Patch('tasks/:taskId/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  assign(
    @Param('taskId') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.assign(taskId, dto, user);
  }

  @Patch('tasks/:taskId/unassign/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  unassign(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.unassign(taskId, userId, user);
  }

  @Get('tasks/:taskId/assignees')
  @UseGuards(TaskAccessGuard)
  getAssigneeHistory(@Param('taskId') taskId: string) {
    return this.tasksService.getAssigneeHistory(taskId);
  }
}
