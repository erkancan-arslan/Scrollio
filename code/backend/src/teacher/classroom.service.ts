import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateClassroomDto } from './dto';

@Injectable()
export class ClassroomTeacherService {
  private readonly logger = new Logger(ClassroomTeacherService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(teacherId: string, dto: CreateClassroomDto) {
    const admin = this.supabaseService.getAdminClient();

    let code: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: codeData } = await admin.rpc('generate_classroom_code');
      const candidate = codeData as string;

      const { data: exists } = await admin
        .from('classrooms')
        .select('id')
        .eq('code', candidate)
        .maybeSingle();

      if (!exists) {
        code = candidate;
        break;
      }
    }

    if (!code) throw new BadRequestException('Could not generate unique classroom code');

    const { data, error } = await admin
      .from('classrooms')
      .insert({
        teacher_id: teacherId,
        name: dto.name,
        subject: dto.subject || null,
        grade: dto.grade || null,
        code,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Create classroom error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async listByTeacher(teacherId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('classrooms')
      .select('*, classroom_members(count)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMembers(classroomId: string, teacherId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: classroom } = await admin
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .eq('teacher_id', teacherId)
      .single();

    if (!classroom) throw new NotFoundException('Classroom not found');

    const { data, error } = await admin
      .from('classroom_members')
      .select('*, kids_child_profiles(display_name, avatar_config)')
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async joinByCode(code: string, childProfileId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: classroom, error: findErr } = await admin
      .from('classrooms')
      .select('id, name, is_active')
      .eq('code', code.toUpperCase())
      .single();

    if (findErr || !classroom) throw new NotFoundException('Classroom not found');
    if (!classroom.is_active) throw new BadRequestException('Classroom is no longer active');

    const { data: existing } = await admin
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('child_profile_id', childProfileId)
      .maybeSingle();

    if (existing) return { ...classroom, alreadyJoined: true };

    const { error: joinErr } = await admin
      .from('classroom_members')
      .insert({ classroom_id: classroom.id, child_profile_id: childProfileId });

    if (joinErr) {
      this.logger.error(`Join classroom error: ${joinErr.message}`);
      throw new BadRequestException(joinErr.message);
    }

    return { ...classroom, alreadyJoined: false };
  }

  async listByChild(childProfileId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('classroom_members')
      .select('classroom_id, classrooms(id, name, subject, grade, code, teacher_id, teacher_profiles(name))')
      .eq('child_profile_id', childProfileId);

    if (error) throw error;
    return (data || []).map((m: any) => m.classrooms);
  }
}
