import {
  Controller, Delete, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { memoryStorage } from 'multer';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(TaskAccessGuard)
@Controller('tasks/:taskId/attachments')
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Get()
  findAll(@Param('taskId') taskId: string) {
    return this.attachmentsService.findAll(taskId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.upload(taskId, file, user);
  }

  @Delete(':attachmentId')
  remove(
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.remove(taskId, attachmentId, user);
  }

  @Get(':attachmentId/download')
  download(
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    return this.attachmentsService.download(taskId, attachmentId, res);
  }
}
