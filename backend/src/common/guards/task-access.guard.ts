import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;
    const taskId = params.taskId;

    if (!taskId) return true;
    if (user?.role === UserRole.ADMIN) return true;

    const assignment = await this.prisma.taskAssignee.findFirst({
      where: { taskId, userId: user.sub, isActive: true },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this task');
    }
    return true;
  }
}
