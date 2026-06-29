import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

const PROFILE_SELECT = {
  id: true, email: true, fullName: true, avatarUrl: true,
  role: true, isEmailVerified: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: PROFILE_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName ?? user.fullName, avatarUrl: dto.avatarUrl },
      select: PROFILE_SELECT,
    });
    return { success: true, data: updated };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from current password');
    }

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true, data: { message: 'Password changed successfully' } };
  }
}
