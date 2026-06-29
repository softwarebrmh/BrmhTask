import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { AuditService } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(
    private projectsRepository: ProjectsRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async findAll(companyId: string, user: JwtPayload, query: ProjectQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let result: { data: any[]; total: number };

    if (user.role === UserRole.ADMIN) {
      result = await this.projectsRepository.findMany(companyId, page, limit, query.status, query.search);
    } else {
      result = await this.projectsRepository.findManyByStaff(companyId, user.sub, page, limit, query.status);
    }

    const formatted = await Promise.all(result.data.map((p) => this.format(p)));
    return buildPaginatedResponse(formatted, result.total, { page, limit });
  }

  async create(companyId: string, dto: CreateProjectDto, user: JwtPayload) {
    const project = await this.projectsRepository.create({
      companyId,
      name: dto.name,
      description: dto.description,
      createdBy: user.sub,
    });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.project,
      entityId: project.id,
      action: AuditAction.PROJECT_CREATED,
      actorId: user.sub,
      actorName: user.email,
      after: { name: project.name },
    });

    return { success: true, data: await this.format(project) };
  }

  async findOne(companyId: string, projectId: string, user: JwtPayload) {
    const project = await this.projectsRepository.findById(projectId);
    if (!project || project.companyId !== companyId) throw new NotFoundException('Project not found');

    if (user.role !== UserRole.ADMIN) {
      const taskCount = await this.prisma.task.count({
        where: {
          sprint: { projectId },
          assignees: { some: { userId: user.sub, isActive: true } },
          deletedAt: null,
        },
      });
      if (taskCount === 0) throw new ForbiddenException('You do not have tasks in this project');
    }

    return { success: true, data: await this.format(project) };
  }

  async update(companyId: string, projectId: string, dto: UpdateProjectDto, user: JwtPayload) {
    const project = await this.projectsRepository.findById(projectId);
    if (!project || project.companyId !== companyId) throw new NotFoundException('Project not found');

    const before = { name: project.name, description: project.description };
    const updated = await this.projectsRepository.update(projectId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
    });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.project,
      entityId: projectId,
      action: AuditAction.PROJECT_UPDATED,
      actorId: user.sub,
      actorName: user.email,
      before,
      after: { name: updated.name },
    });

    return { success: true, data: await this.format(updated) };
  }

  async archive(companyId: string, projectId: string, user: JwtPayload) {
    const project = await this.projectsRepository.findById(projectId);
    if (!project || project.companyId !== companyId) throw new NotFoundException('Project not found');

    const hasActive = await this.projectsRepository.hasActiveSprints(projectId);
    if (hasActive) throw new BadRequestException('Cannot archive project with active sprints');

    await this.projectsRepository.update(projectId, { status: 'archived', deletedAt: new Date() });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.project,
      entityId: projectId,
      action: AuditAction.PROJECT_ARCHIVED,
      actorId: user.sub,
      actorName: user.email,
    });

    return { success: true, data: { message: 'Project archived successfully' } };
  }

  // ─── Member management ─────────────────────────────────────────────────────

  async getMembers(projectId: string) {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
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

  async addMember(projectId: string, userId: string, actor: JwtPayload) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) throw new BadRequestException('User is already a member of this project');

    const member = await this.prisma.projectMember.create({
      data: { projectId, userId, addedBy: actor.sub },
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    return { success: true, data: { id: member.id, user: member.user, addedAt: member.addedAt } };
  }

  async removeMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    return { success: true, data: { message: 'Member removed' } };
  }

  private async format(project: any) {
    const taskCount = await this.projectsRepository.getTaskCount(project.id);
    return {
      id: project.id,
      companyId: project.companyId,
      name: project.name,
      description: project.description,
      status: project.status,
      sprintCount: project._count?.sprints ?? 0,
      taskCount,
      createdBy: project.creator,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
