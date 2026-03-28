import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { LessonService } from './lesson.service';
import { LessonOrchestratorService } from './lesson-orchestrator.service';
import { CreateLessonDto } from './dto';

@ApiTags('teacher-lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('teacher/lessons')
export class LessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly orchestrator: LessonOrchestratorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lesson' })
  async create(@Req() req: any, @Body() dto: CreateLessonDto) {
    return this.lessonService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List teacher's lessons" })
  async list(@Req() req: any) {
    return this.lessonService.listByTeacher(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson detail' })
  async getById(@Param('id') id: string, @Req() req: any) {
    return this.lessonService.getById(id, req.user.id);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start lesson generation pipeline' })
  async generate(@Param('id') id: string, @Req() req: any) {
    const lesson = await this.lessonService.getById(id, req.user.id);
    this.orchestrator.run(lesson).catch(() => {});
    return { message: 'Lesson generation started', lessonId: id };
  }
}
