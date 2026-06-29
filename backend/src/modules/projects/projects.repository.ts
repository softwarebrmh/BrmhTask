import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';
import { getPaginationOffset } from '../../common/utils/pagination.util';

const projectInclude = {
  creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: { select: { sprints: { where: { deletedAt: null } } } },
};

@Injectable()
export class ProjectsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { companyId: string; name: string; description?: string; createdBy: string }) {
    return this.prisma.project.create({ data, include: projectInclude });
  }

  async findMany(companyId: string, page: number, limit: number, status?: ProjectStatus, search?: string) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const where: any = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: projectInclude }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total };
  }

  async findManyByStaff(companyId: string, userId: string, page: number, limit: number, status?: ProjectStatus) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const assignedSprintIds = await this.prisma.taskAssignee.findMany({
      where: { userId, isActive: true },
      select: { task: { select: { sprintId: true } } },
    });
    const sprintIds = [...new Set(assignedSprintIds.map((a) => a.task.sprintId))];
    const projectIds = await this.prisma.sprint.findMany({
      where: { id: { in: sprintIds }, deletedAt: null },
      select: { projectId: true },
    });
    const ids = [...new Set(projectIds.map((s) => s.projectId))];

    const where: any = { id: { in: ids }, companyId, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: projectInclude }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.project.findFirst({ where: { id, deletedAt: null }, include: projectInclude });
  }

  async update(id: string, data: Partial<{ name: string; description: string; status: ProjectStatus; deletedAt: Date }>) {
    return this.prisma.project.update({ where: { id }, data, include: projectInclude });
  }

  async hasActiveSprints(projectId: string): Promise<boolean> {
    const count = await this.prisma.sprint.count({
      where: { projectId, status: 'active', deletedAt: null },
    });
    return count > 0;
  }

  async getTaskCount(projectId: string): Promise<number> {
    const sprints = await this.prisma.sprint.findMany({ where: { projectId, deletedAt: null }, select: { id: true } });
    const sprintIds = sprints.map((s) => s.id);
    return this.prisma.task.count({ where: { sprintId: { in: sprintIds }, deletedAt: null } });
  }
}
