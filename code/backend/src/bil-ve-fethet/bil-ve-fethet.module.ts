import { Module } from '@nestjs/common';
import { BilVeFethetController } from './bil-ve-fethet.controller';
import { BilVeFethetService } from './bil-ve-fethet.service';

@Module({
  controllers: [BilVeFethetController],
  providers: [BilVeFethetService],
})
export class BilVeFethetModule {}
