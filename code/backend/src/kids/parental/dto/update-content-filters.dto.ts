import { IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContentFiltersDto {
  @ApiPropertyOptional({ description: 'Blocked topic IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedTopicIds?: string[];

  @ApiPropertyOptional({ description: 'Maximum difficulty level allowed' })
  @IsOptional()
  @IsString()
  maxDifficulty?: string;

  @ApiPropertyOptional({ description: 'Whether to enable safe search' })
  @IsOptional()
  @IsBoolean()
  safeSearchEnabled?: boolean;
}
