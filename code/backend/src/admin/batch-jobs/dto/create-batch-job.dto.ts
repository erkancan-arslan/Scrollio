import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchJobDto {
  @ApiProperty({ description: 'Human-readable title for this batch (used as base for each job title)' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Topic for all 15 videos' })
  @IsString()
  @MaxLength(255)
  topic: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ enum: ['core', 'kids'] })
  @IsString()
  @IsIn(['core', 'kids'])
  contentTarget: string;

  @ApiProperty({ enum: ['tr', 'en'] })
  @IsString()
  @IsIn(['tr', 'en'])
  language: string;

  @ApiPropertyOptional({ enum: ['formal', 'friendly', 'energetic'] })
  @IsOptional()
  @IsString()
  @IsIn(['formal', 'friendly', 'energetic'])
  tone?: string;

  @ApiPropertyOptional({ description: 'Custom prompt appended to each job\'s system prompt' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customPrompt?: string;

  @ApiProperty({ description: 'UUID of the reference video to use for lipsync on all 15 jobs' })
  @IsUUID()
  referenceVideoId: string;

  @ApiPropertyOptional({ description: 'UUID of the brainrot background video for split-screen composition' })
  @IsOptional()
  @IsUUID()
  brainrotVideoId?: string;
}
