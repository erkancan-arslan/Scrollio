import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TeacherSignUpDto, TeacherSignInDto } from './dto';

export interface TeacherAuthResponse {
  user: { id: string; email: string; name: string };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  };
}

@Injectable()
export class TeacherAuthService {
  private readonly logger = new Logger(TeacherAuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async signUp(dto: TeacherSignUpDto): Promise<TeacherAuthResponse> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { display_name: dto.name, role: 'teacher' },
    });

    if (error) {
      this.logger.error(`Teacher signup error: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const userId = data.user.id;

    const { error: profileError } = await admin
      .from('teacher_profiles')
      .insert({
        id: userId,
        email: dto.email,
        name: dto.name,
        school: dto.school || null,
        subject: dto.subject || null,
      });

    if (profileError) {
      this.logger.error(`Teacher profile insert error: ${profileError.message}`);
      throw new BadRequestException('Failed to create teacher profile');
    }

    const { error: roleError } = await admin.from('user_roles').insert({
      user_id: userId,
      role: 'teacher',
    });

    if (roleError) {
      this.logger.warn(`Teacher role insert: ${roleError.message}`);
    }

    const supabase = this.supabaseService.getClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (signInError || !signInData.session) {
      throw new BadRequestException('Account created but auto-login failed. Please sign in.');
    }

    return {
      user: { id: userId, email: dto.email, name: dto.name },
      session: {
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        expiresIn: signInData.session.expires_in,
        expiresAt: signInData.session.expires_at!,
      },
    };
  }

  async signIn(dto: TeacherSignInDto): Promise<TeacherAuthResponse> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const admin = this.supabaseService.getAdminClient();
    const { data: profile } = await admin
      .from('teacher_profiles')
      .select('name')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      throw new UnauthorizedException('No teacher profile found for this account');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || dto.email,
        name: profile.name,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at!,
      },
    };
  }
}
