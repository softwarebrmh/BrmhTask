import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPaginationOffset } from '../../common/utils/pagination.util';
import { TaskStatus, TaskPriority } from '@prisma/client';

const userSelect = { id: true, fullName: true, email: true, avatarUrl: true };

const taskBaseInclude = {
  owner: { select: userSelect },
  assignees: {
    where: { isActive: true },
    include: { user: { select: userSelect } },
  },
  parentTask: { select: { id: true, name: true, taskNumber: true } },
  _count: {
    select: {
      subTasks: { where: { deletedAt: null } },
    },
  },
};

@Injectable()
export class TasksRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.task.create({ data, include: taskBaseInclude });
  }

  async findManyForUser(
    userId: string,
    role: string,
    companyId: string | undefined,
    page: number,
    limit: number,
    filters: {
      status?: TaskStatus;
      priority?: TaskPriority;
      search?: string;
      parentTaskId?: string | null;
    },
  ) {
    const { skip, take } = getPaginationOffset({ page, limit });
    const where: any = { deletedAt: null };

    if (role === 'owner' && companyId) {
      where.companyId = companyId;
    } else {
      where.assignees = { some: { userId, isActive: true } };
    }

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    if (filters.parentTaskId === null) where.parentTaskId = null;
    else if (filters.parentTaskId) where.parentTaskId = filters.parentTaskId;

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ plannedDueDate: 'asc' }, { createdAt: 'desc' }],
        include: taskBaseInclude,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.task.findFirst({ where: { id, deletedAt: null }, include: taskBaseInclude });
  }

  async findByIdDetail(id: string) {
    return this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...taskBaseInclude,
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            author: { select: userSelect },
            replies: { where: { deletedAt: null }, include: { author: { select: userSelect } } },
            reactions: true,
          },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { uploader: { select: userSelect } },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.task.update({ where: { id }, data, include: taskBaseInclude });
  }

  async softDelete(id: string) {
    await this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async softDeleteChildren(parentTaskId: string) {
    await this.prisma.task.updateMany({ where: { parentTaskId, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async createAssignee(data: { taskId: string; userId: string; assignedBy: string }) {
    return this.prisma.taskAssignee.create({ data });
  }

  async findActiveAssignee(taskId: string, userId: string) {
    return this.prisma.taskAssignee.findFirst({ where: { taskId, userId, isActive: true } });
  }

  async deactivateAssignee(id: string) {
    return this.prisma.taskAssignee.update({ where: { id }, data: { isActive: false, unassignedAt: new Date() } });
  }

  async findAssigneeHistory(taskId: string) {
    return this.prisma.taskAssignee.findMany({
      where: { taskId },
      orderBy: [{ isActive: 'desc' }, { assignedAt: 'desc' }],
      include: {
        user: { select: userSelect },
        assignedByUser: { select: userSelect },
      },
    });
  }

  async getCompanyIdByTask(taskId: string): Promise<string | null> {
    const task = await this.prisma.task.findFirst({ where: { id: taskId } });
    return task?.companyId ?? null;
  }

  async findSubtasks(parentTaskId: string) {
    return this.prisma.task.findMany({
      where: { parentTaskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        assignees: {
          where: { isActive: true },
          include: { user: { select: userSelect } },
        },
      },
    });
  }
}
