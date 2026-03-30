import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Kids batch: admin picks how many lesson variants (same overall topic); each variant is rendered for every mascot (bird, cat, dragon).
 */
export class CreateKidsBatchJobDto {
  @ApiProperty({
    description:
      'How many distinct lesson angles to generate. Total jobs = videoCount × (number of kids mascot reference videos, usually 3).',
    minimum: 1,
    maximum: 40,
  })
  @IsInt()
  @Min(1)
  @Max(40)
  videoCount: number;

  @ApiProperty({ description: 'Batch title (prefix for each job title)' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Overall theme; each row gets its own sub-topic from the LLM' })
  @IsString()
  @MaxLength(255)
  topic: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ enum: ['tr', 'en'] })
  @IsString()
  @IsIn(['tr', 'en'])
  language: string;

  @ApiPropertyOptional({ enum: ['formal', 'friendly', 'energetic'] })
  @IsOptional()
  @IsString()
  @IsIn(['formal', 'friendly', 'energetic'])
  tone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customPrompt?: string;

  @ApiProperty({ enum: ['7-9', '10-12'], description: 'Published to kids_content.age_group' })
  @IsString()
  @IsIn(['7-9', '10-12'])
  ageGroup: '7-9' | '10-12';

  @ApiProperty({
    type: [String],
    description: 'kids_content.topic_tags — must match kids_topics.name for feed overlap',
  })
  @IsArray()
  @IsString({ each: true })
  topicTags: string[];

  @ApiPropertyOptional({
    description: 'Optional: limit bundle to these reference video UUIDs (must be kids + character_id). Omit = all mascot bases.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  referenceVideoIds?: string[];
}
