import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SprintStatus } from '@prisma/client';
import { getPaginationOffset } from '../../common/utils/pagination.util';

const sprintInclude = {
  creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: {
    select: {
      tasks: { where: { deletedAt: null, parentTaskId: null } },
    },
  },
};

@Injectable()
export class SprintsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { projectId: string; name: string; goal?: string; startDate?: Date; endDate?: Date; createdBy: string }) {
    return this.prisma.sprint.create({ data, include: sprintInclude });
  }

  async findMany(projectId: string, page: number, limit: number, status?: SprintStatus) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const where: any = { projectId, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sprint.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
        include: sprintInclude,
      }),
      this.prisma.sprint.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.sprint.findFirst({ where: { id, deletedAt: null }, include: sprintInclude });
  }

  async findActiveInProject(projectId: string) {
    return this.prisma.sprint.findFirst({ where: { projectId, status: 'active', deletedAt: null } });
  }

  async update(id: string, data: any) {
    return this.prisma.sprint.update({ where: { id }, data, include: sprintInclude });
  }

  async getCompletedTaskCount(sprintId: string): Promise<number> {
    return this.prisma.task.count({ where: { sprintId, status: 'done', deletedAt: null, parentTaskId: null } });
  }
}
