import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params, query } = request;
    const companyId = params.companyId ?? query.companyId;

    if (!companyId) return true;

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) throw new NotFoundException('Company not found');

    if (company.ownerId !== user?.sub) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    request.company = company;
    return true;
  }
}
