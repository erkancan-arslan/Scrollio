import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProgressQueryDto {
  @ApiPropertyOptional({ description: 'Filter by time period (e.g. week, month, all)' })
  @IsOptional()
  @IsString()
  period?: string = 'all';
}
