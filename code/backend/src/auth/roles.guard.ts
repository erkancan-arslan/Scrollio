import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    // Check roles from user_roles table
    const admin = this.supabaseService.getAdminClient();
    const { data: userRoles, error } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (error) {
      throw new ForbiddenException('Failed to verify user roles');
    }

    const roleList = (userRoles ?? []).map((r: { role: string }) => r.role);

    // Attach roles to request for downstream use
    request.userRoles = roleList;

    const hasRole = requiredRoles.some((role) => roleList.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
