import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetScreenTimeDto {
  @ApiProperty({ description: 'Daily screen time limit in minutes' })
  @IsInt()
  @Min(5)
  @Max(480)
  dailyLimitMinutes: number;

  @ApiPropertyOptional({ description: 'Start time for allowed usage (HH:mm format)' })
  @IsOptional()
  @IsString()
  allowedStartTime?: string;

  @ApiPropertyOptional({ description: 'End time for allowed usage (HH:mm format)' })
  @IsOptional()
  @IsString()
  allowedEndTime?: string;
}
