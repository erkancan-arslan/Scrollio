import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKidsVideoBundleDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  topic: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ enum: ['tr', 'en'] })
  @IsIn(['tr', 'en'])
  language: string;

  @ApiPropertyOptional({ enum: ['formal', 'friendly', 'energetic'] })
  @IsOptional()
  @IsIn(['formal', 'friendly', 'energetic'])
  tone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({ enum: ['7-9', '10-12'], description: 'Kids feed age band' })
  @IsIn(['7-9', '10-12'])
  ageGroup: '7-9' | '10-12';

  @ApiProperty({
    description: 'Topic names for kids feed (must overlap child selected topics)',
    type: [String],
    example: ['Science', 'Nature'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  topicTags: string[];

  @ApiPropertyOptional({
    description:
      'If omitted, all reference_videos with audience kids + character_id are used (e.g. 3 mascots).',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  referenceVideoIds?: string[];
}
