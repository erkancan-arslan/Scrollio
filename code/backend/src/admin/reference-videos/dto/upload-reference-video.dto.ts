import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KIDS_MASCOT_CHARACTER_IDS } from '../../../kids/constants/kids-mascots';

export class UploadReferenceVideoDto {
  @ApiProperty({ example: 'Fizik Dersi - Artun' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personaName?: string;

  @ApiPropertyOptional({ example: 'tr' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'core' })
  @IsOptional()
  @IsString()
  audienceTag?: string;

  @ApiPropertyOptional({
    example: 'bird',
    description: 'Required for kids mascot base clips (bird | cat | dragon)',
    enum: KIDS_MASCOT_CHARACTER_IDS,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn([...KIDS_MASCOT_CHARACTER_IDS])
  characterId?: string;
}
