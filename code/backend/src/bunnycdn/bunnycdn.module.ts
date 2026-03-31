import { Module } from '@nestjs/common';
import { BunnyCdnService } from './bunnycdn.service';

@Module({
  providers: [BunnyCdnService],
  exports: [BunnyCdnService],
})
export class BunnyCdnModule {}
