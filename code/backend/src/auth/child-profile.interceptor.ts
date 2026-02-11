import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChildProfileInterceptor implements NestInterceptor {
  constructor(private readonly supabaseService: SupabaseService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const childProfileId = request.headers['x-child-profile-id'] as string;
    const user = request.user;

    if (childProfileId && user?.id) {
      // TODO: validate that childProfileId belongs to authenticated user
    }

    return next.handle();
  }
}
