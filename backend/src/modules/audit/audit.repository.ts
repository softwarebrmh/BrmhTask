import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { getPaginationOffset } from '../../common/utils/pagination.util';

export interface AuditEntryInput {
  companyId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: AuditEntryInput) {
    return this.prisma.auditTrail.create({
      data: {
        companyId: data.companyId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorId: data.actorId,
        actorName: data.actorName,
        before: data.before as Prisma.InputJsonValue,
        after: data.after as Prisma.InputJsonValue,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
      include: { actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
  }

  async findByTask(taskId: string, page: number, limit: number) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const where: Prisma.AuditTrailWhereInput = { entityId: taskId };

    const [data, total] = await Promise.all([
      this.prisma.auditTrail.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return { data, total };
  }

  async findByCompany(
    companyId: string,
    page: number,
    limit: number,
    filters: { entityType?: AuditEntityType; actorId?: string; from?: string; to?: string },
  ) {
    const { skip, take } = getPaginationOffset({ page, limit });

    const where: Prisma.AuditTrailWhereInput = {
      companyId,
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.actorId && { actorId: filters.actorId }),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from && { gte: new Date(filters.from) }),
              ...(filters.to && { lte: new Date(filters.to) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditTrail.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return { data, total };
  }
}
