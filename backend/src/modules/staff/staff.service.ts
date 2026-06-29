import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StaffRepository } from './staff.repository';
import { AuditService } from '../audit/audit.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { generateInviteToken } from '../../common/utils/token.util';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StaffService {
  constructor(
    private staffRepository: StaffRepository,
    private auditService: AuditService,
    private config: ConfigService,
  ) {}

  async findAll(companyId: string, query: StaffQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.staffRepository.findMany(
      companyId, page, limit, query.status, query.search,
    );
    return buildPaginatedResponse(data.map(this.format), total, { page, limit });
  }

  async invite(companyId: string, dto: InviteStaffDto, user: JwtPayload) {
    const existing = await this.staffRepository.findByEmail(dto.email, companyId);
    if (existing && existing.status !== 'invited') {
      throw new ConflictException('A staff member with this email already exists in the company');
    }
    if (existing && existing.status === 'invited') {
      throw new ConflictException('An invitation for this email is already pending');
    }

    const inviteToken = generateInviteToken();
    const expiryDays = this.config.get<number>('app.inviteTokenExpiryDays') ?? 7;
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + expiryDays);

    const staff = await this.staffRepository.create({
      companyId,
      email: dto.email,
      designation: dto.designation,
      inviteToken,
      inviteExpiresAt,
    });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.staff,
      entityId: staff.id,
      action: AuditAction.STAFF_INVITED,
      actorId: user.sub,
      actorName: user.email,
      after: { email: dto.email },
    });

    // TODO: send invitation email via mailer service
    const frontendUrl = this.config.get<string>('app.frontendUrl');
    console.log(`[INVITE] ${frontendUrl}/invite/${inviteToken}`);

    return { success: true, data: this.format(staff) };
  }

  async findOne(companyId: string, staffId: string) {
    const staff = await this.staffRepository.findById(staffId, companyId);
    if (!staff) throw new NotFoundException('Staff member not found');
    return { success: true, data: this.format(staff) };
  }

  async update(companyId: string, staffId: string, dto: UpdateStaffDto) {
    const staff = await this.staffRepository.findById(staffId, companyId);
    if (!staff) throw new NotFoundException('Staff member not found');
    const updated = await this.staffRepository.update(staffId, { designation: dto.designation });
    return { success: true, data: this.format(updated) };
  }

  async suspend(companyId: string, staffId: string, user: JwtPayload) {
    const staff = await this.staffRepository.findById(staffId, companyId);
    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.status !== 'active') {
      throw new BadRequestException('Staff member is not currently active');
    }
    const updated = await this.staffRepository.update(staffId, { status: 'suspended' });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.staff,
      entityId: staffId,
      action: AuditAction.STAFF_SUSPENDED,
      actorId: user.sub,
      actorName: user.email,
    });

    return { success: true, data: this.format(updated) };
  }

  async activate(companyId: string, staffId: string, user: JwtPayload) {
    const staff = await this.staffRepository.findById(staffId, companyId);
    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.status !== 'suspended') {
      throw new BadRequestException('Staff member is not currently suspended');
    }
    const updated = await this.staffRepository.update(staffId, { status: 'active' });

    await this.auditService.log({
      companyId,
      entityType: AuditEntityType.staff,
      entityId: staffId,
      action: AuditAction.STAFF_ACTIVATED,
      actorId: user.sub,
      actorName: user.email,
    });

    return { success: true, data: this.format(updated) };
  }

  async resendInvite(companyId: string, staffId: string) {
    const staff = await this.staffRepository.findById(staffId, companyId);
    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.status !== 'invited') {
      throw new BadRequestException('Staff member has already accepted the invitation');
    }

    const inviteToken = generateInviteToken();
    const expiryDays = this.config.get<number>('app.inviteTokenExpiryDays') ?? 7;
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + expiryDays);

    await this.staffRepository.update(staffId, { inviteToken, inviteExpiresAt });

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    console.log(`[INVITE RESENT] ${frontendUrl}/invite/${inviteToken}`);

    return { success: true, data: { message: 'Invitation resent successfully' } };
  }

  private format(staff: any) {
    return {
      id: staff.id,
      companyId: staff.companyId,
      email: staff.email,
      designation: staff.designation,
      status: staff.status,
      user: staff.user ?? null,
      joinedAt: staff.joinedAt,
      lastActiveAt: staff.lastActiveAt,
      createdAt: staff.createdAt,
    };
  }
}
