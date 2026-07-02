import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, UnprocessableEntityException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskEffortDto } from './dto/update-task-effort.dto';
import { UpdateTaskPriorityDto } from './dto/update-task-priority.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { VALID_TASK_TRANSITIONS, TaskStatus } from '../../common/enums/task-status.enum';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { computeSlippage } from '../../common/utils/slippage.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const DISPLAY_ID_OFFSET = 1000;
const MAX_TREE_DEPTH = 6;

@Injectable()
export class TasksService {
  constructor(
    private tasksRepository: TasksRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

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

  async updatePriority(taskId: string, dto: UpdateTaskPriorityDto, user: JwtPayload) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const before = task.priority;
    const updated = await this.tasksRepository.update(taskId, { priority: dto.priority });
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_PRIORITY_CHANGED, actorId: user.sub, actorName: user.email,
      before: { priority: before }, after: { priority: dto.priority },
    });

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
    if (newStatus === TaskStatus.COMPLETED && !task.actualDueDate) {
      updateData.actualDueDate = new Date();
    }

    const updated = await this.tasksRepository.update(taskId, updateData);
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
      action: AuditAction.TASK_STATUS_CHANGED, actorId: user.sub, actorName: user.email,
      before: { status: currentStatus }, after: { status: newStatus },
    });

    if (newStatus === TaskStatus.COMPLETED) {
      await this.auditService.log({
        companyId: companyId!, entityType: AuditEntityType.task, entityId: taskId,
        action: AuditAction.TASK_COMPLETED, actorId: user.sub, actorName: user.email,
      });
    }

    return { success: true, data: await this.formatTask(updated) };
  }

  async updateEffort(taskId: string, dto: UpdateTaskEffortDto, user: JwtPayload) {
    if (dto.actualEffortPh === undefined && dto.estimatedEffortPh === undefined) {
      throw new UnprocessableEntityException('At least one effort field is required');
    }
    if (user.role === UserRole.EMPLOYEE && dto.estimatedEffortPh !== undefined) {
      throw new ForbiddenException('Employees cannot update estimated effort');
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
        id: a.id,
        user: a.user,
        assignedBy: a.assignedByUser,
        assignedAt: a.assignedAt,
        unassignedAt: a.unassignedAt,
        isActive: a.isActive,
      })),
    };
  }

  async getSubtasks(parentTaskId: string) {
    const subtasks = await this.tasksRepository.findSubtasks(parentTaskId);
    return {
      success: true,
      data: subtasks.map((t: any) => ({
        id: t.id,
        displayId: `TK-${DISPLAY_ID_OFFSET + t.taskNumber}`,
        name: t.name,
        status: t.status,
        priority: t.priority,
        assignees: t.assignees?.map((a: any) => a.user) ?? [],
        plannedDueDate: t.plannedDueDate,
      })),
    };
  }

  async getTaskTree(taskId: string) {
    const current = await this.tasksRepository.findById(taskId);
    if (!current) throw new NotFoundException('Task not found');

    let root = current;
    let guard = 0;
    while (root.parentTaskId && guard < MAX_TREE_DEPTH) {
      const parent = await this.tasksRepository.findById(root.parentTaskId);
      if (!parent) break;
      root = parent;
      guard++;
    }

    const tree = await this.buildSubtree(root, 0);
    return { success: true, data: { tree, currentTaskId: taskId } };
  }

  private async buildSubtree(task: any, depth: number): Promise<any> {
    const node = {
      id: task.id,
      displayId: `TK-${DISPLAY_ID_OFFSET + task.taskNumber}`,
      name: task.name,
      status: task.status,
      priority: task.priority,
      plannedDueDate: task.plannedDueDate,
      assignees: task.assignees?.map((a: any) => a.user) ?? [],
      children: [] as any[],
    };
    if (depth >= MAX_TREE_DEPTH) return node;

    const children = await this.tasksRepository.findSubtasks(task.id);
    node.children = await Promise.all(children.map((c: any) => this.buildSubtree(c, depth + 1)));
    return node;
  }

  async createSubtask(parentTaskId: string, dto: CreateSubtaskDto, user: JwtPayload) {
    const parent = await this.tasksRepository.findById(parentTaskId);
    if (!parent) throw new NotFoundException('Task not found');

    if (dto.assigneeIds?.length) {
      await this.validateAssignees(dto.assigneeIds, parent.companyId);
    }

    const subtask = await this.tasksRepository.create({
      companyId: parent.companyId,
      parentTaskId,
      name: dto.name,
      priority: dto.priority ?? 'medium',
      plannedDueDate: dto.plannedDueDate ? new Date(dto.plannedDueDate) : undefined,
      ownerId: user.sub,
      createdBy: user.sub,
    });

    if (dto.assigneeIds?.length) {
      for (const userId of dto.assigneeIds) {
        await this.tasksRepository.createAssignee({ taskId: subtask.id, userId, assignedBy: user.sub });
      }
    }

    await this.auditService.log({
      companyId: parent.companyId, entityType: AuditEntityType.task, entityId: subtask.id,
      action: AuditAction.TASK_CREATED, actorId: user.sub, actorName: user.email,
      after: { name: subtask.name, priority: subtask.priority, parentTaskId },
    });

    const fresh = await this.tasksRepository.findById(subtask.id);
    return { success: true, data: await this.formatTask(fresh!) };
  }

  private async validateAssignees(assigneeIds: string[], companyId: string) {
    for (const userId of assigneeIds) {
      const memberRecord = await this.prisma.companyMember.findFirst({
        where: { userId, companyId, status: 'active', deletedAt: null },
      });
      const isOwner = await this.prisma.company.findFirst({ where: { id: companyId, ownerId: userId } });
      if (!memberRecord && !isOwner) {
        throw new BadRequestException(`User ${userId} is not an active member in this company`);
      }
    }
  }

  async formatTask(task: any) {
    return {
      id: task.id,
      displayId: `TK-${DISPLAY_ID_OFFSET + task.taskNumber}`,
      companyId: task.companyId,
      parentTaskId: task.parentTaskId,
      parentTask: task.parentTask
        ? { id: task.parentTask.id, displayId: `TK-${DISPLAY_ID_OFFSET + task.parentTask.taskNumber}`, name: task.parentTask.name }
        : null,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      plannedDueDate: task.plannedDueDate,
      actualDueDate: task.actualDueDate,
      estimatedEffortPh: Number(task.estimatedEffortPh),
      actualEffortPh: Number(task.actualEffortPh),
      slippagePh: computeSlippage(task.actualEffortPh, task.estimatedEffortPh),
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
