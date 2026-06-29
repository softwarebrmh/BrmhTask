import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskAccessGuard } from '../../common/guards/task-access.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(TaskAccessGuard)
@Controller('tasks/:taskId/notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(@Param('taskId') taskId: string, @Query() query: NoteQueryDto) {
    return this.notesService.findAll(taskId, query);
  }

  @Get(':noteId')
  findOne(@Param('taskId') taskId: string, @Param('noteId') noteId: string) {
    return this.notesService.findOne(taskId, noteId);
  }

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.create(taskId, dto, user);
  }

  @Patch(':noteId')
  update(
    @Param('taskId') taskId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.update(taskId, noteId, dto, user);
  }

  @Delete(':noteId')
  remove(
    @Param('taskId') taskId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.remove(taskId, noteId, user);
  }
}
