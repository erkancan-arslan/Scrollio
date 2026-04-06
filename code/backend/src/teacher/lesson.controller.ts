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
import { LessonCdnMigrationService } from './lesson-cdn-migration.service';
import { CreateLessonDto } from './dto';

@ApiTags('teacher-lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('teacher/lessons')
export class LessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly orchestrator: LessonOrchestratorService,
    private readonly cdnMigration: LessonCdnMigrationService,
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

  /**
   * Migrate all published lessons — re-uploads any non-BunnyCDN slide media to CDN.
   * Safe to call multiple times; already-migrated slides are skipped automatically.
   */
  @Post('migrate-cdn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate all lesson slide media to BunnyCDN' })
  async migrateAllToCdn() {
    return this.cdnMigration.migrateAllLessons();
  }

  /**
   * Migrate a single lesson's slide media to BunnyCDN.
   */
  @Post(':id/migrate-cdn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate single lesson slide media to BunnyCDN' })
  async migrateSingleToCdn(@Param('id') id: string, @Req() req: any) {
    const lesson = await this.lessonService.getById(id, req.user.id);
    return this.cdnMigration.migrateSingleLesson(
      lesson.id,
      lesson.title,
      lesson.slides_data ?? [],
    );
  }
}
