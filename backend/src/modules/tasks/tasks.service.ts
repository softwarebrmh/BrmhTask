import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, UnprocessableEntityException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskEffortDto } from './dto/update-task-effort.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { VALID_TASK_TRANSITIONS, TaskStatus } from '../../common/enums/task-status.enum';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { computeSlippage } from '../../common/utils/slippage.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private tasksRepository: TasksRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async findAll(sprintId: string, user: JwtPayload, query: TaskQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const parentTaskId = query.parentTaskId === 'null' ? null : query.parentTaskId;

    const filters = {
      status: query.status as any,
      priority: query.priority as any,
      assigneeId: query.assigneeId,
      search: query.search,
      parentTaskId,
    };

    let result: { data: any[]; total: number };
    if (user.role === UserRole.ADMIN) {
      result = await this.tasksRepository.findMany(sprintId, page, limit, filters);
    } else {
      result = await this.tasksRepository.findManyForStaff(sprintId, user.sub, page, limit, filters);
    }

    const formatted = await Promise.all(result.data.map((t) => this.formatTask(t)));
    return buildPaginatedResponse(formatted, result.total, { page, limit });
  }

  async findMine(user: JwtPayload, query: TaskQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const parentTaskId = query.parentTaskId === 'null' ? null : query.parentTaskId;

    const result = await this.tasksRepository.findManyForUser(
      user.sub,
      user.role,
      user.companyId,
      page,
      limit,
      {
        status: query.status as any,
        priority: query.priority as any,
        search: query.search,
        parentTaskId,
      },
    );

    const formatted = await Promise.all(result.data.map((t) => this.formatTask(t)));
    return buildPaginatedResponse(formatted, result.total, { page, limit });
  }

  async create(sprintId: string, dto: CreateTaskDto, user: JwtPayload) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, deletedAt: null },
      include: { project: true },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (sprint.status === 'completed') throw new BadRequestException('Cannot add tasks to a completed sprint');

    if (dto.parentTaskId) {
      const parent = await this.prisma.task.findFirst({ where: { id: dto.parentTaskId, sprintId, deletedAt: null } });
      if (!parent) throw new BadRequestException('Parent task not found in this sprint');
    }

    if (dto.assigneeIds?.length) {
      await this.validateAssignees(dto.assigneeIds, (sprint as any).project.companyId);
    }

    const task = await this.tasksRepository.create({
      sprintId,
      name: dto.name,
      description: dto.description,
      parentTaskId: dto.parentTaskId,
      priority: dto.priority ?? 'medium',
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      plannedDueDate: dto.plannedDueDate ? new Date(dto.plannedDueDate) : undefined,
      plannedEffortPh: dto.plannedEffortPh ?? 0,
      estimatedEffortPh: dto.estimatedEffortPh ?? 0,
      ownerId: user.sub,
      createdBy: user.sub,
    });

    const companyId = (sprint as any).project.companyId;
    await this.auditService.log({
      companyId, entityType: AuditEntityType.task, entityId: task.id,
      action: AuditAction.TASK_CREATED, actorId: user.sub, actorName: user.email,
      after: { name: task.name, priority: task.priority },
    });

    if (dto.assigneeIds?.length) {
      for (const userId of dto.assigneeIds) {
        await this.tasksRepository.createAssignee({ taskId: task.id, userId, assignedBy: user.sub });
        await this.auditService.log({
          companyId, entityType: AuditEntityType.task, entityId: task.id,
          action: AuditAction.TASK_ASSIGNED, actorId: user.sub, actorName: user.email,
          metadata: { assignedUserId: userId },
        });
      }
    }

    const fresh = await this.tasksRepository.findById(task.id);
    return { success: true, data: await this.formatTask(fresh!) };
  }

  async findOne(taskId: string) {
    const task = await this.tasksRepository.findByIdDetail(taskId);
    if (!task) throw new NotFoundException('Task not found');
    return { success: true, data: await this.formatTaskDetail(task) };
  }

  async update(taskId: string, dto: UpdateTaskDto, user: JwtPayload) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const before: any = {};
    const after: any = {};
    const updateData: any = {};

    if (dto.name) { before.name = task.name; after.name = dto.name; updateData.name = dto.name; }
    if (dto.description !== undefined) { updateData.description = dto.description; }
    if (dto.priority) { before.priority = task.priority; after.priority = dto.priority; updateData.priority = dto.priority; }
    if (dto.startDate) { updateData.startDate = new Date(dto.startDate); }
    if (dto.plannedDueDate) {
      before.plannedDueDate = task.plannedDueDate;
      after.plannedDueDate = dto.plannedDueDate;
      updateData.plannedDueDate = new Date(dto.plannedDueDate);
    }
    if (dto.actualDueDate) { updateData.actualDueDate = new Date(dto.actualDueDate); }
    if (dto.plannedEffortPh !== undefined) { updateData.plannedEffortPh = dto.plannedEffortPh; }
    if (dto.estimatedEffortPh !== undefined) { updateData.estimatedEffortPh = dto.estimatedEffortPh; }

    const updated = await this.tasksRepository.update(taskId, updateData);
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    if (after.priority) {
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_PRIORITY_CHANGED, actorId: user.sub, actorName: user.email,
        before: { priority: before.priority }, after: { priority: after.priority },
      });
    }
    if (after.plannedDueDate) {
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_DUE_DATE_CHANGED, actorId: user.sub, actorName: user.email,
        before: { plannedDueDate: before.plannedDueDate }, after: { plannedDueDate: after.plannedDueDate },
      });
    }
    if (Object.keys(updateData).some((k) => !['priority', 'plannedDueDate', 'actualDueDate'].includes(k))) {
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_UPDATED, actorId: user.sub, actorName: user.email,
        before, after,
      });
    }

    return { success: true, data: await this.formatTask(updated) };
  }

  async remove(taskId: string, user: JwtPayload) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    await this.tasksRepository.softDeleteChildren(taskId);
    await this.tasksRepository.softDelete(taskId);

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_DELETED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: { message: 'Task deleted successfully' } };
  }

  async updateStatus(taskId: string, dto: UpdateTaskStatusDto, user: JwtPayload) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const currentStatus = task.status as TaskStatus;
    const newStatus = dto.status as TaskStatus;
    const valid = VALID_TASK_TRANSITIONS[currentStatus] ?? [];
    if (!valid.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${valid.join(', ')}`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === TaskStatus.DONE && !task.actualDueDate) {
      updateData.actualDueDate = new Date();
    }

    const updated = await this.tasksRepository.update(taskId, updateData);
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_STATUS_CHANGED, actorId: user.sub, actorName: user.email,
      before: { status: currentStatus }, after: { status: newStatus },
    });

    if (newStatus === TaskStatus.DONE) {
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_COMPLETED, actorId: user.sub, actorName: user.email,
      });
    }

    return { success: true, data: await this.formatTask(updated) };
  }

  async updateEffort(taskId: string, dto: UpdateTaskEffortDto, user: JwtPayload) {
    if (!dto.actualEffortPh && !dto.estimatedEffortPh) {
      throw new UnprocessableEntityException('At least one effort field is required');
    }
    if (user.role === UserRole.STAFF && dto.estimatedEffortPh !== undefined) {
      throw new ForbiddenException('Staff cannot update estimated effort');
    }

    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const updateData: any = {};
    if (dto.actualEffortPh !== undefined) updateData.actualEffortPh = dto.actualEffortPh;
    if (dto.estimatedEffortPh !== undefined) updateData.estimatedEffortPh = dto.estimatedEffortPh;

    const before = { actualEffortPh: Number(task.actualEffortPh), estimatedEffortPh: Number(task.estimatedEffortPh) };
    const updated = await this.tasksRepository.update(taskId, updateData);
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_EFFORT_UPDATED, actorId: user.sub, actorName: user.email,
      before, after: updateData,
    });

    return { success: true, data: await this.formatTask(updated) };
  }

  async assign(taskId: string, dto: AssignTaskDto, user: JwtPayload) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.validateAssignees(dto.assigneeIds, companyId!);

    for (const userId of dto.assigneeIds) {
      const existing = await this.tasksRepository.findActiveAssignee(taskId, userId);
      if (existing) continue;

      await this.tasksRepository.createAssignee({ taskId, userId, assignedBy: user.sub });
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_ASSIGNED, actorId: user.sub, actorName: user.email,
        metadata: { assignedUserId: userId },
      });
    }

    const fresh = await this.tasksRepository.findById(taskId);
    return { success: true, data: await this.formatTask(fresh!) };
  }

  async unassign(taskId: string, userId: string, user: JwtPayload) {
    const assignee = await this.tasksRepository.findActiveAssignee(taskId, userId);
    if (!assignee) throw new NotFoundException('User is not an active assignee of this task');

    await this.tasksRepository.deactivateAssignee(assignee.id);
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_UNASSIGNED, actorId: user.sub, actorName: user.email,
      metadata: { unassignedUserId: userId },
    });

    const fresh = await this.tasksRepository.findById(taskId);
    return { success: true, data: await this.formatTask(fresh!) };
  }

  async getAssigneeHistory(taskId: string) {
    const history = await this.tasksRepository.findAssigneeHistory(taskId);
    return {
      success: true,
      data: history.map((a: any) => ({
        user: a.user,
        assignedBy: a.assignedByUser,
        assignedAt: a.assignedAt,
        unassignedAt: a.unassignedAt,
        isActive: a.isActive,
      })),
    };
  }

  private async validateAssignees(assigneeIds: string[], companyId: string) {
    for (const userId of assigneeIds) {
      const staffRecord = await this.prisma.companyStaff.findFirst({
        where: { userId, companyId, status: 'active', deletedAt: null },
      });
      const isOwner = await this.prisma.company.findFirst({ where: { id: companyId, ownerId: userId } });
      if (!staffRecord && !isOwner) {
        throw new BadRequestException(`User ${userId} is not active staff in this company`);
      }
    }
  }

  async formatTask(task: any) {
    const stepProgress = await this.tasksRepository.computeStepProgress(task.id);
    return {
      id: task.id,
      sprintId: task.sprintId,
      parentTaskId: task.parentTaskId,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      plannedDueDate: task.plannedDueDate,
      actualDueDate: task.actualDueDate,
      plannedEffortPh: Number(task.plannedEffortPh),
      estimatedEffortPh: Number(task.estimatedEffortPh),
      actualEffortPh: Number(task.actualEffortPh),
      slippagePh: computeSlippage(task.actualEffortPh, task.plannedEffortPh),
      stepProgress,
      owner: task.owner,
      assignees: task.assignees?.map((a: any) => a.user) ?? [],
      subTaskCount: task._count?.subTasks ?? 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private async formatTaskDetail(task: any) {
    const base = await this.formatTask(task);
    return {
      ...base,
      sprint: task.sprint
        ? {
            id: task.sprint.id,
            projectId: task.sprint.projectId,
            name: task.sprint.name,
            goal: task.sprint.goal,
            status: task.sprint.status,
            startDate: task.sprint.startDate,
            endDate: task.sprint.endDate,
            taskCount: task.sprint._count?.tasks ?? 0,
          }
        : null,
      steps: task.steps ?? [],
      recentComments: (task.comments ?? []).map((c: any) => ({
        id: c.id,
        content: c.deletedAt ? '[deleted]' : c.content,
        author: c.deletedAt ? null : c.author,
        replies: c.replies ?? [],
        reactions: c.reactions ?? [],
        createdAt: c.createdAt,
      })),
      recentAttachments: (task.attachments ?? []).map((a: any) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: Number(a.fileSize),
        mimeType: a.mimeType,
        uploader: a.uploader,
        createdAt: a.createdAt,
      })),
    };
  }
}
