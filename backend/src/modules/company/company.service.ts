import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { AuditService } from '../audit/audit.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { generateSlug } from '../../common/utils/slug.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(
    private companyRepository: CompanyRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateCompanyDto, user: JwtPayload) {
    const existing = await this.companyRepository.findByOwner(user.sub);
    if (existing) throw new ConflictException('You already own a company');

    if (dto.workingHoursStart && dto.workingHoursEnd) {
      this.validateWorkingHours(dto.workingHoursStart, dto.workingHoursEnd);
    }

    const slug = generateSlug(dto.name);
    const company = await this.companyRepository.create({
      name: dto.name,
      slug,
      ownerId: user.sub,
      timezone: dto.timezone,
      workingHoursStart: dto.workingHoursStart,
      workingHoursEnd: dto.workingHoursEnd,
    });

    await this.auditService.log({
      companyId: company.id,
      entityType: AuditEntityType.company,
      entityId: company.id,
      action: AuditAction.COMPANY_CREATED,
      actorId: user.sub,
      actorName: (company as any).owner?.fullName ?? user.email,
      after: { name: company.name },
    });

    return { success: true, data: this.format(company) };
  }

  async lookupByCode(code: string) {
    const slug = code?.toLowerCase().trim();
    if (!slug) throw new BadRequestException('Enter a company join code');

    const company = await this.companyRepository.findBySlug(slug);
    if (!company) throw new NotFoundException('Invalid company join code');

    // Public, pre-signup lookup — expose only what the join form needs.
    return { success: true, data: { name: company.name, slug: company.slug } };
  }

  async findOne(companyId: string, user: JwtPayload) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const isOwner = company.ownerId === user.sub;
    if (!isOwner) {
      const memberRecord = await this.prisma.companyMember.findFirst({
        where: { companyId, userId: user.sub, status: 'active', deletedAt: null },
      });
      if (!memberRecord) throw new ForbiddenException('You do not have access to this company');
    }

    return { success: true, data: this.format(company) };
  }

  async update(companyId: string, dto: UpdateCompanyDto, user: JwtPayload) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const start = dto.workingHoursStart ?? company.workingHoursStart;
    const end = dto.workingHoursEnd ?? company.workingHoursEnd;
    if (dto.workingHoursStart || dto.workingHoursEnd) {
      this.validateWorkingHours(start, end);
    }

    const before = { name: company.name, timezone: company.timezone };
    const updated = await this.companyRepository.update(companyId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.timezone && { timezone: dto.timezone }),
      ...(dto.workingHoursStart && { workingHoursStart: dto.workingHoursStart }),
      ...(dto.workingHoursEnd && { workingHoursEnd: dto.workingHoursEnd }),
    });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.company,
      entityId: companyId,
      action: AuditAction.COMPANY_UPDATED,
      actorId: user.sub,
      actorName: (company as any).owner?.fullName ?? user.email,
      before,
      after: { name: updated.name, timezone: updated.timezone },
    });

    return { success: true, data: this.format(updated) };
  }

  async getAllTasks(companyId: string, query: { status?: string; priority?: string; search?: string; assigneeId?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null, companyId, parentTaskId: null };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.assigneeId) where.assignees = { some: { userId: query.assigneeId, isActive: true } };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignees: {
            where: { isActive: true },
            include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
          },
          _count: { select: { subTasks: { where: { deletedAt: null } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      success: true,
      data: tasks.map((t) => ({
        id: t.id,
        displayId: `TK-${1000 + t.taskNumber}`,
        name: t.name,
        status: t.status,
        priority: t.priority,
        plannedDueDate: t.plannedDueDate,
        createdAt: t.createdAt,
        assignees: t.assignees.map((a) => a.user).filter(Boolean),
        subTaskCount: t._count.subTasks,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTask(
    companyId: string,
    dto: {
      name: string; description?: string; priority?: string;
      assigneeIds?: string[];
      startDate?: string; plannedDueDate?: string;
    },
    user: JwtPayload,
  ) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');

    const task = await this.prisma.task.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        priority: (dto.priority as any) ?? 'medium',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        plannedDueDate: dto.plannedDueDate ? new Date(dto.plannedDueDate) : undefined,
        ownerId: user.sub,
        createdBy: user.sub,
      },
    });

    if (dto.assigneeIds?.length) {
      for (const userId of dto.assigneeIds) {
        await this.prisma.taskAssignee.create({ data: { taskId: task.id, userId, assignedBy: user.sub } });
      }
      await this.auditService.log({
        companyId, entityType: AuditEntityType.task, entityId: task.id,
        action: AuditAction.TASK_ASSIGNED, actorId: user.sub, actorName: user.email,
        metadata: { assignedUserIds: dto.assigneeIds },
      });
    }

    await this.auditService.log({
      companyId, entityType: AuditEntityType.task, entityId: task.id,
      action: AuditAction.TASK_CREATED, actorId: user.sub, actorName: user.email,
      after: { name: task.name, priority: task.priority },
    });

    return { success: true, data: { ...task, displayId: `TK-${1000 + task.taskNumber}` } };
  }

  private validateWorkingHours(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) {
      throw new BadRequestException('workingHoursEnd must be after workingHoursStart');
    }
  }

  private format(company: any) {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      timezone: company.timezone,
      workingHoursStart: company.workingHoursStart,
      workingHoursEnd: company.workingHoursEnd,
      owner: company.owner,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
