import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CreateChildProfileDto,
  SwitchChildProfileDto,
  SetPinDto,
  VerifyPinDto,
  UpgradeRoleDto,
  RegisterParentDto,
  LoginDto,
} from './dto';

const SALT_ROUNDS = 10;
const MAX_CHILDREN = 5;

@Injectable()
export class KidsChildAuthService {
  private readonly logger = new Logger(KidsChildAuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ──────────────────── Auth ────────────────────

  async registerParent(dto: RegisterParentDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: { display_name: dto.displayName || dto.email.split('@')[0] },
      },
    });

    if (error) {
      this.logger.error(`Register error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    if (!data.user || !data.session) {
      throw new BadRequestException('Failed to create account');
    }

    const admin = this.supabaseService.getAdminClient();

    // Create profile row
    await admin.from('profiles').upsert({
      id: data.user.id,
      display_name: dto.displayName || dto.email.split('@')[0],
    });

    // Assign parent role
    await admin.from('user_roles').upsert(
      { user_id: data.user.id, role: 'parent' },
      { onConflict: 'user_id,role' },
    );

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: dto.displayName || data.user.user_metadata?.display_name,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
      },
      role: 'parent',
    };
  }

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!data.user || !data.session) {
      throw new UnauthorizedException('Authentication failed');
    }

    const admin = this.supabaseService.getAdminClient();

    // Fetch user roles
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);

    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    const primaryRole = roleList.includes('parent')
      ? 'parent'
      : roleList.includes('school')
        ? 'school'
        : 'user';

    // Check if PIN is set
    const { data: pinRow } = await admin
      .from('parent_pins')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
      },
      role: primaryRole,
      isPinSet: !!pinRow,
    };
  }

  async getMe(userId: string) {
    const admin = this.supabaseService.getAdminClient();

    const [profileRes, rolesRes, pinRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      admin.from('user_roles').select('role').eq('user_id', userId),
      admin.from('parent_pins').select('id').eq('user_id', userId).maybeSingle(),
    ]);

    const roles = (rolesRes.data ?? []).map((r: { role: string }) => r.role);
    const primaryRole = roles.includes('parent')
      ? 'parent'
      : roles.includes('school')
        ? 'school'
        : 'user';

    return {
      profile: profileRes.data,
      roles,
      primaryRole,
      isPinSet: !!pinRes.data,
    };
  }

  // ──────────────────── PIN ────────────────────

  async setPin(userId: string, dto: SetPinDto) {
    const hash = await bcrypt.hash(dto.pin, SALT_ROUNDS);
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.from('parent_pins').upsert(
      { user_id: userId, pin_hash: hash, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

    if (error) {
      this.logger.error(`setPin error: ${error.message}`);
      throw new BadRequestException('Failed to set PIN');
    }

    return { success: true };
  }

  async verifyPin(userId: string, dto: VerifyPinDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('parent_pins')
      .select('pin_hash')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('PIN not set. Please set a PIN first.');
    }

    const valid = await bcrypt.compare(dto.pin, data.pin_hash);
    return { valid };
  }

  // ──────────────────── Children ────────────────────

  async getChildren(userId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_child_profiles')
      .select('*')
      .eq('parent_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`getChildren error: ${error.message}`);
      throw new BadRequestException('Failed to fetch children');
    }

    return data ?? [];
  }

  async createChild(userId: string, dto: CreateChildProfileDto) {
    const admin = this.supabaseService.getAdminClient();

    // Check max children limit
    const { count } = await admin
      .from('kids_child_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', userId);

    if ((count ?? 0) >= MAX_CHILDREN) {
      throw new BadRequestException(`Maximum of ${MAX_CHILDREN} child profiles allowed`);
    }

    // Insert child profile
    const { data: child, error } = await admin
      .from('kids_child_profiles')
      .insert({
        parent_id: userId,
        display_name: dto.displayName,
        date_of_birth: dto.dateOfBirth ?? null,
        avatar_config: dto.avatarConfig ?? {},
        is_active: true,
      })
      .select()
      .single();

    if (error || !child) {
      this.logger.error(`createChild error: ${error?.message}`);
      throw new BadRequestException('Failed to create child profile');
    }

    // Initialize progress record (level 1, 0 XP)
    await admin.from('kids_progress').insert({
      child_profile_id: child.id,
      level: 1,
      xp: 0,
      progress_map: {},
    });

    // Initialize notification settings
    await admin.from('kids_notification_settings').insert({
      child_profile_id: child.id,
      preferences: { push: true, email: false, daily_reminder: true },
    });

    // Assign top 5 popular topics (by id order if available)
    const { data: topics } = await admin
      .from('kids_topics')
      .select('id')
      .eq('is_active', true)
      .limit(5);

    if (topics && topics.length > 0) {
      await admin.from('kids_child_topics').insert(
        topics.map((t: { id: string }) => ({
          child_profile_id: child.id,
          topic_id: t.id,
        })),
      );
    }

    return child;
  }

  async updateChild(
    userId: string,
    childId: string,
    dto: Partial<CreateChildProfileDto>,
  ) {
    const admin = this.supabaseService.getAdminClient();

    // Validate ownership
    await this.validateChildOwnership(admin, userId, childId);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.displayName !== undefined) updateData.display_name = dto.displayName;
    if (dto.dateOfBirth !== undefined) updateData.date_of_birth = dto.dateOfBirth;
    if (dto.avatarConfig !== undefined) updateData.avatar_config = dto.avatarConfig;

    const { data, error } = await admin
      .from('kids_child_profiles')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to update child profile');
    }

    return data;
  }

  async deleteChild(userId: string, childId: string) {
    const admin = this.supabaseService.getAdminClient();

    await this.validateChildOwnership(admin, userId, childId);

    const { error } = await admin
      .from('kids_child_profiles')
      .delete()
      .eq('id', childId);

    if (error) {
      throw new BadRequestException('Failed to delete child profile');
    }

    return { deleted: true };
  }

  async switchChild(userId: string, dto: SwitchChildProfileDto) {
    const admin = this.supabaseService.getAdminClient();

    const child = await this.validateChildOwnership(admin, userId, dto.childId);

    if (!child.is_active) {
      throw new BadRequestException('Child profile is deactivated');
    }

    return {
      childId: child.id,
      displayName: child.display_name,
      avatarConfig: child.avatar_config,
    };
  }

  // ──────────────────── Role Upgrade ────────────────────

  async upgradeRole(userId: string, dto: UpgradeRoleDto) {
    const admin = this.supabaseService.getAdminClient();

    // Check current roles
    const { data: existingRoles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const currentRoles = (existingRoles ?? []).map(
      (r: { role: string }) => r.role,
    );

    if (currentRoles.includes(dto.targetRole)) {
      throw new BadRequestException(`User already has the '${dto.targetRole}' role`);
    }

    // Only 'user' can upgrade to 'parent'
    if (dto.targetRole === 'parent' && !currentRoles.includes('user')) {
      // If they have no roles at all, insert 'user' first
      if (currentRoles.length === 0) {
        await admin.from('user_roles').insert({ user_id: userId, role: 'user' });
      }
    }

    const { error } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role: dto.targetRole });

    if (error) {
      this.logger.error(`upgradeRole error: ${error.message}`);
      throw new BadRequestException('Failed to upgrade role');
    }

    return { role: dto.targetRole, success: true };
  }

  // ──────────────────── Helpers ────────────────────

  private async validateChildOwnership(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    userId: string,
    childId: string,
  ) {
    const { data: child, error } = await admin
      .from('kids_child_profiles')
      .select('*')
      .eq('id', childId)
      .eq('parent_id', userId)
      .maybeSingle();

    if (error || !child) {
      throw new ForbiddenException('Child profile not found or access denied');
    }

    return child;
  }
}
