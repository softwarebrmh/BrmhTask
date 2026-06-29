import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository, AuditEntryInput } from './audit.repository';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditEntityType } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private auditRepository: AuditRepository) {}

  async log(entry: AuditEntryInput): Promise<void> {
    try {
      await this.auditRepository.create(entry);
    } catch (err) {
      this.logger.error('Audit log failed', err);
    }
  }

  async findByTask(taskId: string, query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const { data, total } = await this.auditRepository.findByTask(taskId, page, limit);
    return buildPaginatedResponse(data.map(this.format), total, { page, limit });
  }

  async findByCompany(companyId: string, query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const { data, total } = await this.auditRepository.findByCompany(
      companyId,
      page,
      limit,
      {
        entityType: query.entityType as AuditEntityType | undefined,
        actorId: query.actorId,
        from: query.from,
        to: query.to,
      },
    );
    return buildPaginatedResponse(data.map(this.format), total, { page, limit });
  }

  private format(trail: any) {
    return {
      id: trail.id,
      entityType: trail.entityType,
      entityId: trail.entityId,
      action: trail.action,
      actor: trail.actor,
      before: trail.before,
      after: trail.after,
      metadata: trail.metadata,
      createdAt: trail.createdAt,
    };
  }
}
