import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/role.enum';
import { AuditEntityType, AuditAction } from '@prisma/client';
import { buildPaginatedResponse, getPaginationOffset } from '../../common/utils/pagination.util';

const AUTHOR_SELECT = { id: true, fullName: true, email: true, avatarUrl: true };

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private tasksRepository: TasksRepository,
  ) {}

  async findAll(taskId: string, query: CommentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = getPaginationOffset({ page, limit });

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { taskId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: { select: AUTHOR_SELECT },
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: AUTHOR_SELECT } },
          },
          reactions: {
            include: { user: { select: AUTHOR_SELECT } },
          },
        },
      }),
      this.prisma.comment.count({ where: { taskId, deletedAt: null } }),
    ]);

    return buildPaginatedResponse(comments.map(this.formatComment), total, { page, limit });
  }

  async create(taskId: string, dto: CreateCommentDto, user: JwtPayload) {
    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    if (!companyId) throw new NotFoundException('Task not found');

    const resolvedMentions = await this.resolveMentions(dto.mentionedUserIds ?? [], companyId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: user.sub,
        content: dto.content,
        metadata: resolvedMentions.length ? { mentions: resolvedMentions } : undefined,
      },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: true,
        reactions: { include: { user: { select: AUTHOR_SELECT } } },
      },
    });

    await this.auditService.log({
      companyId, entityType: AuditEntityType.comment, entityId: comment.id,
      action: AuditAction.COMMENT_ADDED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.formatComment(comment) };
  }

  async update(taskId: string, commentId: string, dto: UpdateCommentDto, user: JwtPayload) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, taskId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');

    if (user.role === UserRole.EMPLOYEE && comment.authorId !== user.sub) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    const resolvedMentions = dto.mentionedUserIds
      ? await this.resolveMentions(dto.mentionedUserIds, companyId!)
      : undefined;

    const updateData: any = {};
    if (dto.content) updateData.content = dto.content;
    if (resolvedMentions !== undefined) {
      updateData.metadata = resolvedMentions.length ? { mentions: resolvedMentions } : null;
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        author: { select: AUTHOR_SELECT },
        replies: { where: { deletedAt: null }, include: { author: { select: AUTHOR_SELECT } } },
        reactions: { include: { user: { select: AUTHOR_SELECT } } },
      },
    });

    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.comment, entityId: commentId,
      action: AuditAction.COMMENT_EDITED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: this.formatComment(updated) };
  }

  async remove(taskId: string, commentId: string, user: JwtPayload) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, taskId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');

    if (user.role === UserRole.EMPLOYEE && comment.authorId !== user.sub) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    await this.auditService.log({
      companyId: companyId!, entityType: AuditEntityType.comment, entityId: commentId,
      action: AuditAction.COMMENT_DELETED, actorId: user.sub, actorName: user.email,
    });

    return { success: true, data: { message: 'Comment deleted' } };
  }

  async createReply(taskId: string, commentId: string, dto: CreateReplyDto, user: JwtPayload) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, taskId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');

    const companyId = await this.tasksRepository.getCompanyIdByTask(taskId);
    const resolvedMentions = await this.resolveMentions(dto.mentionedUserIds ?? [], companyId!);

    const reply = await this.prisma.commentReply.create({
      data: {
        commentId,
        authorId: user.sub,
        content: dto.content,
        metadata: resolvedMentions.length ? { mentions: resolvedMentions } : undefined,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });

    return { success: true, data: reply };
  }

  async removeReply(taskId: string, commentId: string, replyId: string, user: JwtPayload) {
    const reply = await this.prisma.commentReply.findFirst({
      where: { id: replyId, commentId, deletedAt: null },
    });
    if (!reply) throw new NotFoundException('Reply not found');

    if (user.role === UserRole.EMPLOYEE && reply.authorId !== user.sub) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.commentReply.update({ where: { id: replyId }, data: { deletedAt: new Date() } });
    return { success: true, data: { message: 'Reply deleted' } };
  }

  async addReaction(taskId: string, commentId: string, dto: AddReactionDto, user: JwtPayload) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, taskId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentReaction.findFirst({
      where: { commentId, userId: user.sub, emoji: dto.emoji },
    });
    if (existing) {
      await this.prisma.commentReaction.delete({ where: { id: existing.id } });
      return { success: true, data: { toggled: false, message: 'Reaction removed' } };
    }

    const reaction = await this.prisma.commentReaction.create({
      data: { commentId, userId: user.sub, emoji: dto.emoji },
      include: { user: { select: AUTHOR_SELECT } },
    });

    return { success: true, data: { toggled: true, reaction } };
  }

  private async resolveMentions(userIds: string[], companyId: string) {
    if (!userIds.length) return [];
    const results: Array<{ userId: string; fullName: string; email: string }> = [];

    for (const userId of userIds) {
      const staffOrOwner = await this.prisma.companyMember.findFirst({
        where: { userId, companyId, status: 'active', deletedAt: null },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      });

      const isOwner = !staffOrOwner
        ? await this.prisma.company.findFirst({
            where: { id: companyId, ownerId: userId },
            include: { owner: { select: { id: true, fullName: true, email: true } } },
          })
        : null;

      const resolvedUser = staffOrOwner?.user ?? (isOwner as any)?.owner;
      if (!resolvedUser) {
        throw new BadRequestException(`Mentioned user ${userId} is not active staff in this company`);
      }
      results.push({ userId: resolvedUser.id, fullName: resolvedUser.fullName, email: resolvedUser.email });
    }

    return results;
  }

  private formatComment(comment: any) {
    return {
      id: comment.id,
      taskId: comment.taskId,
      content: comment.deletedAt ? '[deleted]' : comment.content,
      author: comment.deletedAt ? null : comment.author,
      mentions: (comment.metadata as any)?.mentions ?? [],
      replies: (comment.replies ?? []).map((r: any) => ({
        id: r.id,
        content: r.deletedAt ? '[deleted]' : r.content,
        author: r.deletedAt ? null : r.author,
        createdAt: r.createdAt,
      })),
      reactions: (comment.reactions ?? []).map((r: any) => ({ id: r.id, emoji: r.emoji, user: r.user })),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
