import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { TasksService } from '../tasks/tasks.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TaskQueryDto } from '../tasks/dto/task-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private tasksService: TasksService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto);
  }

  @Get('me/tasks')
  getMyTasks(@CurrentUser() user: JwtPayload, @Query() query: TaskQueryDto) {
    return this.tasksService.findMine(user, query);
  }
}
