import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateStepDto } from './dto/create-step.dto';
import { ReorderStepsDto } from './dto/reorder-steps.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { TasksRepository } from '../tasks/tasks.repository';

@Injectable()
export class StepsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private tasksRepository: TasksRepository,
  ) {}

  async findAll(taskId: string) {
    const steps = await this.prisma.taskStep.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { checkedByUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
    return { success: true, data: steps.map(this.format) };
  }

  async create(taskId: string, dto: CreateStepDto, user: JwtPayload) {
    let order = dto.order;
    if (order === undefined) {
      const maxStep = await this.prisma.taskStep.findFirst({
        where: { taskId, deletedAt: null },
        orderBy: { order: 'desc' },
      });
      order = (maxStep?.order ?? -1) + 1;
    }

    const step = await this.prisma.taskStep.create({
      data: { taskId, title: dto.title, order },
      include: { checkedByUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.step, entityId: step.id,
      action: AuditAction.STEP_CREATED, actorId: user.sub, actorName: user.email,
      metadata: { taskId, title: dto.title },
    });

    return { success: true, data: this.format(step) };
  }

  async reorder(taskId: string, dto: ReorderStepsDto) {
    const activeSteps = await this.prisma.taskStep.findMany({ where: { taskId, deletedAt: null } });
    const activeIds = new Set(activeSteps.map((s) => s.id));
    const inputIds = new Set(dto.stepIds);

    if (activeIds.size !== inputIds.size || ![...activeIds].every((id) => inputIds.has(id))) {
      throw new BadRequestException('stepIds must be a complete and exact set of all active steps for this task');
    }

    await Promise.all(
      dto.stepIds.map((id, index) =>
        this.prisma.taskStep.update({ where: { id }, data: { order: index } }),
      ),
    );

    return this.findAll(taskId);
  }

  async remove(taskId: string, stepId: string, user: JwtPayload) {
    const step = await this.prisma.taskStep.findFirst({ where: { id: stepId, taskId, deletedAt: null } });
    if (!step) throw new NotFoundException('Step not found');

    await this.prisma.taskStep.update({ where: { id: stepId }, data: { deletedAt: new Date() } });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.step, entityId: stepId,
      action: AuditAction.STEP_DELETED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: { message: 'Step deleted' } };
  }

  async check(taskId: string, stepId: string, userId: string, user: JwtPayload) {
    const step = await this.prisma.taskStep.findFirst({ where: { id: stepId, taskId, deletedAt: null } });
    if (!step) throw new NotFoundException('Step not found');
    if (step.isChecked) return { success: true, data: this.format(step) };

    const updated = await this.prisma.taskStep.update({
      where: { id: stepId },
      data: { isChecked: true, checkedAt: new Date(), checkedBy: userId },
      include: { checkedByUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.step, entityId: stepId,
      action: AuditAction.STEP_CHECKED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.format(updated) };
  }

  async uncheck(taskId: string, stepId: string, user: JwtPayload) {
    const step = await this.prisma.taskStep.findFirst({ where: { id: stepId, taskId, deletedAt: null } });
    if (!step) throw new NotFoundException('Step not found');

    const updated = await this.prisma.taskStep.update({
      where: { id: stepId },
      data: { isChecked: false, checkedAt: null, checkedBy: null },
      include: { checkedByUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.step, entityId: stepId,
      action: AuditAction.STEP_UNCHECKED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.format(updated) };
  }

  private format(step: any) {
    return {
      id: step.id,
      taskId: step.taskId,
      title: step.title,
      isChecked: step.isChecked,
      order: step.order,
      checkedAt: step.checkedAt,
      checkedBy: step.checkedByUser ?? null,
      createdAt: step.createdAt,
    };
  }
}
