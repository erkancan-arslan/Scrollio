import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';

@Module({
    imports: [SupabaseModule],
    controllers: [ClassroomController],
    providers: [ClassroomService],
    exports: [ClassroomService],
})
export class ClassroomModule { }
