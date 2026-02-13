import { Module } from '@nestjs/common';
import { DuelController } from './duel.controller';
import { DuelService } from './duel.service';
import { DuelTickService } from './duel-tick.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [DuelController],
    providers: [DuelService, DuelTickService],
    exports: [DuelService],
})
export class DuelModule { }
