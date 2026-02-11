import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoiceCommandDto {
  @ApiProperty({ description: 'Transcribed voice command text' })
  @IsString()
  command: string;

  @ApiPropertyOptional({ description: 'Language code of the voice input (e.g. en-US)' })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({ description: 'Current screen context for command resolution' })
  @IsOptional()
  @IsString()
  screenContext?: string;
}
