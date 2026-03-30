import { IsString, IsOptional, MinLength, MaxLength, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KIDS_MASCOT_CHARACTER_IDS } from '../../constants/kids-mascots';

export class CreateChildProfileDto {
  @ApiProperty({ description: 'Display name for the child' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  displayName: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Avatar configuration JSON' })
  @IsOptional()
  @IsObject()
  avatarConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Kids mascot id: bird | cat | dragon (must match reference_videos.character_id)',
    enum: KIDS_MASCOT_CHARACTER_IDS,
  })
  @IsOptional()
  @IsString()
  @IsIn([...KIDS_MASCOT_CHARACTER_IDS])
  @MaxLength(32)
  selectedCharacterId?: string;
}
