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

  async findOne(companyId: string, user: JwtPayload) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const isOwner = company.ownerId === user.sub;
    if (!isOwner) {
      const staffRecord = await this.prisma.companyStaff.findFirst({
        where: { companyId, userId: user.sub, status: 'active', deletedAt: null },
      });
      if (!staffRecord) throw new ForbiddenException('You do not have access to this company');
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
