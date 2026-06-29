import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../../common/enums/role.enum';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: 'admin',
        isEmailVerified: false,
      },
    });

    const token = this.issueToken({
      sub: user.id,
      email: user.email,
      role: UserRole.ADMIN,
    });

    return {
      success: true,
      data: {
        accessToken: token,
        user: this.formatUser(user),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid email or password');

    let companyId: string | undefined;

    if (user.role === 'staff') {
      const staffRecord = await this.prisma.companyStaff.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (staffRecord?.status === 'suspended') {
        throw new ForbiddenException('Your account has been suspended');
      }
      companyId = staffRecord?.companyId;

      if (staffRecord) {
        await this.prisma.companyStaff.update({
          where: { id: staffRecord.id },
          data: { lastActiveAt: new Date() },
        });
      }
    } else if (user.role === 'admin') {
      const company = await this.prisma.company.findFirst({
        where: { ownerId: user.id, deletedAt: null },
      });
      companyId = company?.id;
    }

    const token = this.issueToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      companyId,
    });

    return {
      success: true,
      data: {
        accessToken: token,
        user: this.formatUser(user, companyId),
      },
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const staffRecord = await this.prisma.companyStaff.findFirst({
      where: { inviteToken: dto.token, deletedAt: null },
    });
    if (!staffRecord) throw new NotFoundException('Invitation not found or already used');

    if (staffRecord.inviteExpiresAt && staffRecord.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired. Please ask admin to resend.');
    }
    if (staffRecord.status !== 'invited') {
      throw new BadRequestException('Invitation has already been accepted');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user = await this.prisma.user.findFirst({
      where: { email: staffRecord.email, deletedAt: null },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: staffRecord.email,
          passwordHash,
          fullName: dto.fullName,
          role: 'staff',
          isEmailVerified: true,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, fullName: dto.fullName },
      });
    }

    await this.prisma.companyStaff.update({
      where: { id: staffRecord.id },
      data: {
        userId: user.id,
        status: 'active',
        joinedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    const token = this.issueToken({
      sub: user.id,
      email: user.email,
      role: UserRole.STAFF,
      companyId: staffRecord.companyId,
    });

    return {
      success: true,
      data: {
        accessToken: token,
        user: this.formatUser(user, staffRecord.companyId),
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();
    return { success: true, data: this.formatUser(user) };
  }

  private issueToken(payload: { sub: string; email: string; role: UserRole; companyId?: string }) {
    return this.jwtService.sign(payload);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    
    if (user) {
      const resetPasswordToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpiresAt = new Date();
      resetPasswordExpiresAt.setHours(resetPasswordExpiresAt.getHours() + 1);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken,
          resetPasswordExpiresAt,
        },
      });

      console.log(`[PASSWORD RESET] http://localhost:3001/reset-password?token=${resetPasswordToken}`);
    }

    return {
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been generated.',
      },
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: dto.token, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return {
      success: true,
      data: {
        message: 'Password reset successful',
      },
    };
  }

  private formatUser(user: any, companyId?: string) {
    return {
      sub: user.id,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      companyId: companyId ?? null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}
