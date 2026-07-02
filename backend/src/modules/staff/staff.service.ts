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
import { MailService } from '../mail/mail.service';

@Injectable()
export class StaffService {
  constructor(
    private staffRepository: StaffRepository,
    private auditService: AuditService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async findAll(companyId: string, query: StaffQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.staffRepository.findMany(
      companyId, page, limit, query.status, query.search,
    );

    const userIds = data.map((s) => s.userId).filter((id): id is string => !!id);
    const taskCounts = userIds.length
      ? await this.staffRepository.countActiveTasksByUser(companyId, userIds)
      : new Map<string, number>();

    return buildPaginatedResponse(
      data.map((s) => this.format(s, taskCounts.get(s.userId ?? '') ?? 0)),
      total,
      { page, limit },
    );
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
      entityType: AuditEntityType.member,
      entityId: staff.id,
      action: AuditAction.MEMBER_INVITED,
      actorId: user.sub,
      actorName: user.email,
      after: { email: dto.email },
    });

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;
    await this.mail.sendInvite(dto.email, inviteUrl);

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
      entityType: AuditEntityType.member,
      entityId: staffId,
      action: AuditAction.MEMBER_SUSPENDED,
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
      entityType: AuditEntityType.member,
      entityId: staffId,
      action: AuditAction.MEMBER_ACTIVATED,
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
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;
    await this.mail.sendInvite(staff.email, inviteUrl);

    return { success: true, data: { message: 'Invitation resent successfully' } };
  }

  private format(staff: any, activeTaskCount = 0) {
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
      activeTaskCount,
    };
  }
}
