import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { ParentPinGuard } from './parent-pin.guard';
import { ChildProfileInterceptor } from './child-profile.interceptor';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, ParentPinGuard, ChildProfileInterceptor],
  exports: [AuthService, AuthGuard, RolesGuard, ParentPinGuard, ChildProfileInterceptor],
})
export class AuthModule {}

