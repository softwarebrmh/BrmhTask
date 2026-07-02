import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus } from '@prisma/client';
import { getPaginationOffset } from '../../common/utils/pagination.util';

const staffInclude = {
  user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
};

@Injectable()
export class StaffRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    companyId: string;
    email: string;
    designation?: string;
    inviteToken: string;
    inviteExpiresAt: Date;
  }) {
    return this.prisma.companyMember.create({ data, include: staffInclude });
  }

  async findMany(
    companyId: string,
    page: number,
    limit: number,
    status?: MemberStatus,
    search?: string,
  ) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const where: any = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.companyMember.findMany({
        where,
        skip,
        take,
        orderBy: [{ joinedAt: 'desc' }],
        include: staffInclude,
      }),
      this.prisma.companyMember.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.companyMember.findFirst({
      where: { id, companyId, deletedAt: null },
      include: staffInclude,
    });
  }

  async findByEmail(email: string, companyId: string) {
    return this.prisma.companyMember.findFirst({
      where: { email, companyId, deletedAt: null },
    });
  }

  async findByToken(token: string) {
    return this.prisma.companyMember.findFirst({
      where: { inviteToken: token, deletedAt: null },
    });
  }

  async findByUserId(userId: string, companyId: string) {
    return this.prisma.companyMember.findFirst({
      where: { userId, companyId, deletedAt: null },
      include: staffInclude,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.companyMember.update({ where: { id }, data, include: staffInclude });
  }

  async countActiveTasksByUser(companyId: string, userIds: string[]) {
    const groups = await this.prisma.taskAssignee.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        isActive: true,
        task: { companyId, deletedAt: null, status: { not: 'completed' } },
      },
      _count: { id: true },
    });
    return new Map(groups.map((g) => [g.userId, g._count.id]));
  }
}
