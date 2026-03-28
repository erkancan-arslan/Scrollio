import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateLessonDto } from './dto';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(teacherId: string, dto: CreateLessonDto) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('teacher_lessons')
      .insert({
        teacher_id: teacherId,
        classroom_id: dto.classroomId || null,
        title: dto.title,
        topic: dto.topic,
        description: dto.description || null,
        subject: dto.subject || null,
        grade: dto.grade || null,
        tone: dto.tone || 'friendly',
        language: dto.language || 'tr',
        difficulty: dto.difficulty || 'medium',
        includes_problem_solving: dto.includesProblemSolving || false,
        problem_count: dto.problemCount || 0,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Create lesson error: ${error.message}`);
      throw error;
    }
    return data;
  }

  async listByTeacher(teacherId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('teacher_lessons')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(lessonId: string, teacherId?: string) {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('teacher_lessons').select('*').eq('id', lessonId);

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query.single();
    if (error || !data) throw new NotFoundException('Lesson not found');
    return data;
  }

  async updateStatus(
    lessonId: string,
    status: string,
    extra?: Record<string, any>,
  ) {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin
      .from('teacher_lessons')
      .update({
        status,
        ...extra,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId);

    if (error) {
      this.logger.error(`Update lesson status error: ${error.message}`);
    }
  }

  async listPublishedForClassroom(classroomId: string) {
    const admin = this.supabaseService.getAdminClient();

    // Get the teacher who owns this classroom
    const { data: classroom, error: clsErr } = await admin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (clsErr || !classroom) {
      this.logger.warn(`listPublishedForClassroom: classroom ${classroomId} not found`);
      return [];
    }

    // Return all published lessons from that teacher
    // (includes lessons explicitly linked to this classroom AND lessons with no classroom_id)
    const { data, error } = await admin
      .from('teacher_lessons')
      .select('id, title, topic, subject, grade, difficulty, duration, status, created_at, slides_data')
      .eq('teacher_id', classroom.teacher_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPublishedById(lessonId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('teacher_lessons')
      .select('*, teacher_profiles(name, reference_video_url)')
      .eq('id', lessonId)
      .eq('status', 'published')
      .single();

    if (error || !data) throw new NotFoundException('Lesson not found');
    return data;
  }
}
