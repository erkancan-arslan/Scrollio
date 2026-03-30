import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 'brainrot', enum: ['reference', 'brainrot'] })
  @IsOptional()
  @IsString()
  type?: string;
}
