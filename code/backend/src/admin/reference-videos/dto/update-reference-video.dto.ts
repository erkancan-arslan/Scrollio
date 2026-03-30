import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { KIDS_MASCOT_CHARACTER_IDS } from '../../../kids/constants/kids-mascots';

export class UpdateReferenceVideoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  personaName?: string;

  @ApiPropertyOptional({ enum: ['tr', 'en'] })
  @IsOptional()
  @IsString()
  @IsIn(['tr', 'en'])
  language?: string;

  @ApiPropertyOptional({ enum: ['core', 'kids'] })
  @IsOptional()
  @IsString()
  @IsIn(['core', 'kids'])
  audienceTag?: string;

  @ApiPropertyOptional({ description: 'Kids mascot: bird | cat | dragon', enum: KIDS_MASCOT_CHARACTER_IDS })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([...KIDS_MASCOT_CHARACTER_IDS])
  characterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: ['ready', 'processing', 'failed'] })
  @IsOptional()
  @IsString()
  @IsIn(['ready', 'processing', 'failed'])
  status?: string;
}
