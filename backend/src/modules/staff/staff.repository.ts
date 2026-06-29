import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffStatus } from '@prisma/client';
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
    return this.prisma.companyStaff.create({ data, include: staffInclude });
  }

  async findMany(
    companyId: string,
    page: number,
    limit: number,
    status?: StaffStatus,
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
      this.prisma.companyStaff.findMany({
        where,
        skip,
        take,
        orderBy: [{ joinedAt: 'desc' }],
        include: staffInclude,
      }),
      this.prisma.companyStaff.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.companyStaff.findFirst({
      where: { id, companyId, deletedAt: null },
      include: staffInclude,
    });
  }

  async findByEmail(email: string, companyId: string) {
    return this.prisma.companyStaff.findFirst({
      where: { email, companyId, deletedAt: null },
    });
  }

  async findByToken(token: string) {
    return this.prisma.companyStaff.findFirst({
      where: { inviteToken: token, deletedAt: null },
    });
  }

  async findByUserId(userId: string, companyId: string) {
    return this.prisma.companyStaff.findFirst({
      where: { userId, companyId, deletedAt: null },
      include: staffInclude,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.companyStaff.update({ where: { id }, data, include: staffInclude });
  }
}
