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
