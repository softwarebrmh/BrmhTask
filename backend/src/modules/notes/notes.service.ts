import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { buildPaginatedResponse, getPaginationOffset } from '../../common/utils/pagination.util';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private tasksRepository: TasksRepository,
  ) {}

  async findAll(taskId: string, query: NoteQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = getPaginationOffset({ page, limit });

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: { taskId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { author: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
      this.prisma.note.count({ where: { taskId, deletedAt: null } }),
    ]);

    return buildPaginatedResponse(notes.map(this.format), total, { page, limit });
  }

  async findOne(taskId: string, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, taskId, deletedAt: null },
      include: {
        author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');
    return { success: true, data: { ...this.format(note), versions: note.versions } };
  }

  async create(taskId: string, dto: CreateNoteDto, user: JwtPayload) {
    const note = await this.prisma.note.create({
      data: { taskId, authorId: user.sub, title: dto.title, content: dto.content },
      include: { author: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.note, entityId: note.id,
      action: AuditAction.NOTE_CREATED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.format(note) };
  }

  async update(taskId: string, noteId: string, dto: UpdateNoteDto, user: JwtPayload) {
    const note = await this.prisma.note.findFirst({ where: { id: noteId, taskId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    if (user.role === UserRole.STAFF && note.authorId !== user.sub) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    const versionCount = await this.prisma.noteVersion.count({ where: { noteId: note.id } });
    await this.prisma.noteVersion.create({
      data: { noteId: note.id, content: note.content, version: versionCount + 1, createdBy: user.sub },
    });

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: { title: dto.title ?? note.title, content: dto.content ?? note.content },
      include: { author: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.note, entityId: noteId,
      action: AuditAction.NOTE_UPDATED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.format(updated) };
  }

  async remove(taskId: string, noteId: string, user: JwtPayload) {
    const note = await this.prisma.note.findFirst({ where: { id: noteId, taskId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    if (user.role === UserRole.STAFF && note.authorId !== user.sub) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.prisma.note.update({ where: { id: noteId }, data: { deletedAt: new Date() } });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.note, entityId: noteId,
      action: AuditAction.NOTE_UPDATED, actorId: user.sub, actorName: user.email,
      metadata: { deleted: true },
    });

    return { success: true, data: { message: 'Note deleted' } };
  }

  private format(note: any) {
    return {
      id: note.id,
      taskId: note.taskId,
      title: note.title,
      content: note.content,
      author: note.author,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
