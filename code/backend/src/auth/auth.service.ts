import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Register a new user
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password, displayName } = signUpDto;

    const supabase = this.supabaseService.getClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      this.logger.error(`Sign up error: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    if (!data.user || !data.session) {
      throw new BadRequestException('Failed to create user account');
    }

    // Create profile in profiles table
    const adminClient = this.supabaseService.getAdminClient();
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: data.user.id,
      display_name: displayName || email.split('@')[0],
    });

    if (profileError) {
      this.logger.warn(`Profile creation warning: ${profileError.message}`);
      // Don't fail the signup if profile creation fails
      // Profile can be created later via trigger or manual update
    }

    return this.formatAuthResponse(data.user, data.session);
  }

  /**
   * Sign in existing user
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { email, password } = signInDto;

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.error(`Sign in error: ${error.message}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedException('Authentication failed');
    }

    return this.formatAuthResponse(data.user, data.session);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto;

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      this.logger.error(`Token refresh error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedException('Token refresh failed');
    }

    return this.formatAuthResponse(data.user, data.session);
  }

  /**
   * Sign out user (invalidate session)
   */
  async signOut(accessToken: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);

    const { error } = await supabase.auth.signOut();

    if (error) {
      this.logger.error(`Sign out error: ${error.message}`);
      throw new BadRequestException('Failed to sign out');
    }
  }

  /**
   * Get current user from access token
   */
  async getCurrentUser(accessToken: string): Promise<UserProfile> {
    const supabase = this.supabaseService.getClientWithAuth(accessToken);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      displayName: data.user.user_metadata?.display_name,
    };
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'scrollio://reset-password',
    });

    if (error) {
      this.logger.error(`Password reset error: ${error.message}`);
      // Don't reveal if email exists for security
    }

    // Always return success to prevent email enumeration
  }

  /**
   * Format auth response
   */
  private formatAuthResponse(user: any, session: any): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.display_name,
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at,
      },
    };
  }
}

