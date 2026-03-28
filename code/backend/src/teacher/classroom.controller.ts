import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ClassroomTeacherService } from './classroom.service';
import { CreateClassroomDto } from './dto';

@ApiTags('teacher-classroom')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('teacher/classrooms')
export class ClassroomTeacherController {
  constructor(private readonly classroomService: ClassroomTeacherService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new classroom' })
  async create(@Req() req: any, @Body() dto: CreateClassroomDto) {
    return this.classroomService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List teacher's classrooms" })
  async list(@Req() req: any) {
    return this.classroomService.listByTeacher(req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List classroom members' })
  async getMembers(@Param('id') id: string, @Req() req: any) {
    return this.classroomService.getMembers(id, req.user.id);
  }
}
