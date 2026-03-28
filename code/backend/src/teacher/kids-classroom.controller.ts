import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ClassroomTeacherService } from './classroom.service';
import { LessonService } from './lesson.service';

@ApiTags('kids-classroom')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('kids/classroom')
export class KidsClassroomController {
  constructor(
    private readonly classroomService: ClassroomTeacherService,
    private readonly lessonService: LessonService,
  ) {}

  @Post('join')
  @ApiOperation({ summary: 'Kid joins classroom by code' })
  async join(@Body() body: { code: string; childProfileId: string }) {
    if (!body.childProfileId) {
      throw new BadRequestException('childProfileId is required');
    }
    return this.classroomService.joinByCode(body.code, body.childProfileId);
  }

  @Get()
  @ApiOperation({ summary: 'List classrooms child has joined' })
  @ApiQuery({ name: 'childProfileId', required: true })
  async listClassrooms(@Query('childProfileId') childProfileId: string) {
    if (!childProfileId) return [];
    return this.classroomService.listByChild(childProfileId);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'List published lessons in a classroom' })
  async listLessons(@Param('id') classroomId: string) {
    return this.lessonService.listPublishedForClassroom(classroomId);
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson detail with slides_data' })
  async getLessonDetail(@Param('id') lessonId: string) {
    return this.lessonService.getPublishedById(lessonId);
  }
}
