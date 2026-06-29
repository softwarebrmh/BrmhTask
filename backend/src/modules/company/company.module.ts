import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from './company.repository';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository, RolesGuard, CompanyOwnerGuard],
  exports: [CompanyService, CompanyRepository],
})
export class CompanyModule {}
