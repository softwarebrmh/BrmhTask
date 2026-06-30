import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffRepository } from './staff.repository';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, MailModule],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository, RolesGuard, CompanyOwnerGuard],
  exports: [StaffService, StaffRepository],
})
export class StaffModule {}
