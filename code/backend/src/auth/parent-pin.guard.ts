import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * ParentPinGuard — Verifies the user has a parent PIN set.
 * Actual PIN verification happens via the /kids/auth/pin/verify endpoint.
 * This guard ensures the user is a parent who has set up a PIN.
 */
@Injectable()
export class ParentPinGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    // Check that user has a parent PIN set
    const admin = this.supabaseService.getAdminClient();
    const { data } = await admin
      .from('parent_pins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) {
      throw new ForbiddenException('Parent PIN not set. Please set a PIN first.');
    }

    return true;
  }
}
