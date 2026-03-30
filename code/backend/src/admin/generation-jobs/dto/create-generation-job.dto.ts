import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGenerationJobDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty()
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

  @ApiPropertyOptional({ description: 'Target video duration in seconds (30-300)' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  durationTargetSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Custom prompt appended to system prompt' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customPrompt?: string;

  @ApiProperty({ description: 'UUID of the reference video to use for lipsync' })
  @IsUUID()
  referenceVideoId: string;

  @ApiPropertyOptional({ description: 'UUID of the brainrot background video for split-screen composition' })
  @IsOptional()
  @IsUUID()
  brainrotVideoId?: string;
}
