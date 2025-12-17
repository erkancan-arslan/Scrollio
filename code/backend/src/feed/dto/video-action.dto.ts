import { IsUUID, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class VideoIdParamDto {
  @IsUUID()
  videoId: string;
}

export class RecordViewDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  watchDuration: number; // Seconds watched

  @IsBoolean()
  @IsOptional()
  completed?: boolean; // Did user watch >80%
}

