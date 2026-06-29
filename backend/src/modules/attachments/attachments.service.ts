import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createReadStream } from 'fs';

@Injectable()
export class AttachmentsService {
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;
  private readonly uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private tasksRepository: TasksRepository,
    private config: ConfigService,
  ) {
    this.allowedMimeTypes = this.config.get<string[]>('app.allowedMimeTypes') ?? [];
    this.maxFileSize = this.config.get<number>('app.maxFileSizeBytes') ?? 10 * 1024 * 1024;
    this.uploadDir = this.config.get<string>('app.uploadDir') ?? 'uploads';
  }

  async findAll(taskId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });
    return { success: true, data: attachments.map(this.format) };
  }

  async upload(taskId: string, file: Express.Multer.File, user: JwtPayload) {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(`File type ${file.mimetype} is not allowed`);
    }

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    if (!companyId) throw new NotFoundException('Task not found');

    const uploadSubDir = path.join(this.uploadDir, companyId, taskId);
    if (!fs.existsSync(uploadSubDir)) {
      fs.mkdirSync(uploadSubDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadSubDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        uploaderId: user.sub,
        fileName: file.originalname,
        filePath,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
      },
      include: { uploader: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    await this.auditService.log({
      companyId, entityType: AuditEntityType.attachment, entityId: attachment.id,
      action: AuditAction.ATTACHMENT_UPLOADED, actorId: user.sub, actorName: user.email,
      metadata: { taskId, fileName: file.originalname, fileSize: file.size },
    });

    return { success: true, data: this.format(attachment) };
  }

  async remove(taskId: string, attachmentId: string, user: JwtPayload) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, taskId, deletedAt: null },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (user.role === UserRole.STAFF && attachment.uploaderId !== user.sub) {
      throw new ForbiddenException('You can only delete your own attachments');
    }

    await this.prisma.attachment.update({ where: { id: attachmentId }, data: { deletedAt: new Date() } });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.attachment, entityId: attachmentId,
      action: AuditAction.ATTACHMENT_DELETED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: { message: 'Attachment deleted' } };
  }

  async download(taskId: string, attachmentId: string, res: Response) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, taskId, deletedAt: null },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (!fs.existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.fileSize.toString());

    const stream = createReadStream(attachment.filePath);
    stream.pipe(res);
  }

  private format(attachment: any) {
    return {
      id: attachment.id,
      taskId: attachment.taskId,
      fileName: attachment.fileName,
      fileSize: Number(attachment.fileSize),
      mimeType: attachment.mimeType,
      uploader: attachment.uploader,
      downloadUrl: `/api/v1/tasks/${attachment.taskId}/attachments/${attachment.id}/download`,
      createdAt: attachment.createdAt,
    };
  }
}
