import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    ownerId: string;
    timezone?: string;
    workingHoursStart?: string;
    workingHoursEnd?: string;
  }) {
    return this.prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        timezone: data.timezone ?? 'UTC',
        workingHoursStart: data.workingHoursStart ?? '09:00',
        workingHoursEnd: data.workingHoursEnd ?? '18:00',
      },
      include: { owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: { owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
  }

  async findByOwner(ownerId: string) {
    return this.prisma.company.findFirst({
      where: { ownerId, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findFirst({ where: { slug, deletedAt: null } });
  }

  async update(id: string, data: Partial<{
    name: string;
    logoUrl: string | null;
    timezone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
  }>) {
    return this.prisma.company.update({
      where: { id },
      data,
      include: { owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
  }
}
