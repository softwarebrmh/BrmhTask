import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(TaskAccessGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  findAll(@Param('taskId') taskId: string, @Query() query: CommentQueryDto) {
    return this.commentsService.findAll(taskId, query);
  }

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.create(taskId, dto, user);
  }

  @Patch(':commentId')
  update(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.update(taskId, commentId, dto, user);
  }

  @Delete(':commentId')
  remove(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.remove(taskId, commentId, user);
  }

  @Post(':commentId/replies')
  createReply(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.createReply(taskId, commentId, dto, user);
  }

  @Delete(':commentId/replies/:replyId')
  removeReply(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Param('replyId') replyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.removeReply(taskId, commentId, replyId, user);
  }

  @Post(':commentId/reactions')
  addReaction(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: AddReactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.addReaction(taskId, commentId, dto, user);
  }
}
