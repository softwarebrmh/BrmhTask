import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard(companyId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');

    const now = new Date();

    const [
      totalStaff,
      activeStaff,
      taskStats,
      overdueCount,
      unassignedCount,
      upcomingDeadlines,
      workload,
      recentActivity,
    ] = await Promise.all([
      this.prisma.companyMember.count({ where: { companyId, deletedAt: null } }),
      this.prisma.companyMember.count({ where: { companyId, status: 'active', deletedAt: null } }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { deletedAt: null, companyId },
        _count: { id: true },
      }),
      this.prisma.task.count({
        where: { deletedAt: null, companyId, status: { not: 'completed' }, plannedDueDate: { lt: now } },
      }),
      this.prisma.task.count({
        where: { deletedAt: null, companyId, assignees: { none: { isActive: true } } },
      }),
      this.prisma.task.findMany({
        where: { deletedAt: null, companyId, status: { not: 'completed' }, plannedDueDate: { not: null } },
        orderBy: { plannedDueDate: 'asc' },
        take: 5,
        include: {
          assignees: {
            where: { isActive: true },
            include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.taskAssignee.groupBy({
        by: ['userId'],
        where: { isActive: true, task: { companyId, deletedAt: null, status: { not: 'completed' } } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.auditTrail.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
    ]);

    const taskStatusMap: Record<string, number> = {};
    for (const group of taskStats) {
      taskStatusMap[group.status] = group._count.id;
    }

    const workloadUsers = workload.length
      ? await this.prisma.user.findMany({
          where: { id: { in: workload.map((w) => w.userId) } },
          select: { id: true, fullName: true, avatarUrl: true },
        })
      : [];
    const workloadUserMap = new Map(workloadUsers.map((u) => [u.id, u]));

    return {
      success: true,
      data: {
        staff: { total: totalStaff, active: activeStaff, pending: totalStaff - activeStaff },
        tasks: {
          todo: taskStatusMap['todo'] ?? 0,
          inProgress: taskStatusMap['in_progress'] ?? 0,
          review: taskStatusMap['review'] ?? 0,
          done: taskStatusMap['completed'] ?? 0,
          total: Object.values(taskStatusMap).reduce((a, b) => a + b, 0),
          overdue: overdueCount,
          unassigned: unassignedCount,
        },
        upcomingDeadlines: upcomingDeadlines.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          priority: t.priority,
          plannedDueDate: t.plannedDueDate,
          assignees: t.assignees.map((a) => a.user),
        })),
        workload: workload
          .map((w) => ({ user: workloadUserMap.get(w.userId) ?? null, activeTaskCount: w._count.id }))
          .filter((w) => w.user),
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          actor: a.actor,
          createdAt: a.createdAt,
        })),
      },
    };
  }

  async getStaffDashboard(user: JwtPayload) {
    const companyId = user.companyId;
    if (!companyId) throw new NotFoundException('No company context');

    const [myTasks, myTaskStats] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          deletedAt: null,
          assignees: { some: { userId: user.sub, isActive: true } },
        },
        orderBy: { plannedDueDate: 'asc' },
        take: 10,
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          assignees: { some: { userId: user.sub, isActive: true } },
        },
        _count: { id: true },
      }),
    ]);

    const taskStatusMap: Record<string, number> = {};
    for (const group of myTaskStats) {
      taskStatusMap[group.status] = group._count.id;
    }

    // Fetch activity relevant to this employee: their own actions + events on their tasks
    const myTaskIds = myTasks.map((t) => t.id);
    const recentActivity = await this.prisma.auditTrail.findMany({
      where: {
        companyId,
        OR: [
          { actorId: user.sub },
          ...(myTaskIds.length > 0
            ? [{ entityId: { in: myTaskIds }, action: { in: ['TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_COMPLETED', 'TASK_UPDATED'] as any } }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    return {
      success: true,
      data: {
        myTasks: {
          todo: taskStatusMap['todo'] ?? 0,
          inProgress: taskStatusMap['in_progress'] ?? 0,
          review: taskStatusMap['review'] ?? 0,
          done: taskStatusMap['completed'] ?? 0,
        },
        upcomingTasks: myTasks.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          priority: t.priority,
          plannedDueDate: t.plannedDueDate,
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          actor: a.actor,
          createdAt: a.createdAt,
        })),
      },
    };
  }
}
