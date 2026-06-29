import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SprintsRepository } from './sprints.repository';
import { AuditService } from '../audit/audit.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintQueryDto } from './dto/sprint-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SprintsService {
  constructor(
    private sprintsRepository: SprintsRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async findAll(projectId: string, query: SprintQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.sprintsRepository.findMany(projectId, page, limit, query.status);
    const formatted = await Promise.all(data.map((s) => this.format(s)));
    return buildPaginatedResponse(formatted, total, { page, limit });
  }

  async create(projectId: string, dto: CreateSprintDto, user: JwtPayload) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw new NotFoundException('Project not found');

    if (dto.startDate && dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const sprint = await this.sprintsRepository.create({
      projectId,
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      createdBy: user.sub,
    });

    const companyId = project.companyId;
    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.sprint,
      entityId: sprint.id,
      action: AuditAction.SPRINT_CREATED,
      actorId: user.sub,
      actorName: user.email,
      after: { name: sprint.name },
    });

    return { success: true, data: await this.format(sprint) };
  }

  async findOne(projectId: string, sprintId: string) {
    const sprint = await this.sprintsRepository.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId) throw new NotFoundException('Sprint not found');
    return { success: true, data: await this.format(sprint) };
  }

  async update(projectId: string, sprintId: string, dto: UpdateSprintDto, user: JwtPayload) {
    const sprint = await this.sprintsRepository.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId) throw new NotFoundException('Sprint not found');
    if (sprint.status === 'completed') throw new BadRequestException('Cannot update a completed sprint');

    const before = { name: sprint.name, goal: sprint.goal };
    const updated = await this.sprintsRepository.update(sprintId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.goal !== undefined && { goal: dto.goal }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
    });

    const project = await this.prisma.project.findFirst({ where: { id: projectId } });
    await this.auditService.log({
      companyId: project!.companyId,
      entityType: AuditEntityType.sprint,
      entityId: sprintId,
      action: AuditAction.SPRINT_UPDATED,
      actorId: user.sub,
      actorName: user.email,
      before,
      after: { name: updated.name },
    });

    return { success: true, data: await this.format(updated) };
  }

  async start(projectId: string, sprintId: string, user: JwtPayload) {
    const sprint = await this.sprintsRepository.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId) throw new NotFoundException('Sprint not found');
    if (sprint.status !== 'draft') throw new BadRequestException('Sprint must be in draft status to start');

    const activeSprint = await this.sprintsRepository.findActiveInProject(projectId);
    if (activeSprint && activeSprint.id !== sprintId) {
      throw new BadRequestException('Another sprint is already active in this project');
    }

    const updated = await this.sprintsRepository.update(sprintId, {
      status: 'active',
      startDate: sprint.startDate ?? new Date(),
    });

    const project = await this.prisma.project.findFirst({ where: { id: projectId } });
    await this.auditService.log({
      companyId: project!.companyId,
      entityType: AuditEntityType.sprint,
      entityId: sprintId,
      action: AuditAction.SPRINT_STARTED,
      actorId: user.sub,
      actorName: user.email,
    });

    return { success: true, data: await this.format(updated) };
  }

  async end(projectId: string, sprintId: string, user: JwtPayload) {
    const sprint = await this.sprintsRepository.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId) throw new NotFoundException('Sprint not found');
    if (sprint.status !== 'active') throw new BadRequestException('Sprint must be active to end');

    const updated = await this.sprintsRepository.update(sprintId, {
      status: 'completed',
      endDate: sprint.endDate ?? new Date(),
    });

    const project = await this.prisma.project.findFirst({ where: { id: projectId } });
    await this.auditService.log({
      companyId: project!.companyId,
      entityType: AuditEntityType.sprint,
      entityId: sprintId,
      action: AuditAction.SPRINT_ENDED,
      actorId: user.sub,
      actorName: user.email,
    });

    return { success: true, data: await this.format(updated) };
  }

  // ─── Member management ─────────────────────────────────────────────────────

  async getMembers(sprintId: string) {
    const members = await this.prisma.sprintMember.findMany({
      where: { sprintId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        addedByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { addedAt: 'asc' },
    });
    return { success: true, data: members.map((m) => ({
      id: m.id,
      user: m.user,
      addedBy: m.addedByUser,
      addedAt: m.addedAt,
    })) };
  }

  async addMember(sprintId: string, userId: string, actor: JwtPayload) {
    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, deletedAt: null } });
    if (!sprint) throw new NotFoundException('Sprint not found');

    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.sprintMember.findUnique({
      where: { sprintId_userId: { sprintId, userId } },
    });
    if (existing) throw new ConflictException('User is already a member of this sprint');

    const member = await this.prisma.sprintMember.create({
      data: { sprintId, userId, addedBy: actor.sub },
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    return { success: true, data: { id: member.id, user: member.user, addedAt: member.addedAt } };
  }

  async removeMember(sprintId: string, userId: string) {
    const member = await this.prisma.sprintMember.findUnique({
      where: { sprintId_userId: { sprintId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.sprintMember.delete({
      where: { sprintId_userId: { sprintId, userId } },
    });

    return { success: true, data: { message: 'Member removed' } };
  }

  async format(sprint: any) {
    const completedTaskCount = await this.sprintsRepository.getCompletedTaskCount(sprint.id);
    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      taskCount: sprint._count?.tasks ?? 0,
      completedTaskCount,
      createdBy: sprint.creator,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
    };
  }
}
