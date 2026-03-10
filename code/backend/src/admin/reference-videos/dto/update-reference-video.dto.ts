import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
