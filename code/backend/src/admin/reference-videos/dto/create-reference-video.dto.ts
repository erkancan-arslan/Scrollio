import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KIDS_MASCOT_CHARACTER_IDS } from '../../../kids/constants/kids-mascots';

export class CreateReferenceVideoDto {
  @ApiProperty({ description: 'Title of the reference video' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Teacher or persona name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  personaName?: string;

  @ApiProperty({ enum: ['tr', 'en'] })
  @IsString()
  @IsIn(['tr', 'en'])
  language: string;

  @ApiPropertyOptional({ enum: ['core', 'kids'], description: 'Intended audience, null for reusable' })
  @IsOptional()
  @IsString()
  @IsIn(['core', 'kids'])
  audienceTag?: string;

  @ApiPropertyOptional({
    description: 'Kids mascot: bird | cat | dragon; must match kids_child_profiles.selected_character_id',
    enum: KIDS_MASCOT_CHARACTER_IDS,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([...KIDS_MASCOT_CHARACTER_IDS])
  characterId?: string;

  @ApiProperty({ description: 'Storage path or public URL of the uploaded video' })
  @IsString()
  storagePath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
