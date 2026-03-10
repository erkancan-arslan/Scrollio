import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerationJobQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'queued', 'processing', 'published', 'failed'] })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'queued', 'processing', 'published', 'failed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['core', 'kids'] })
  @IsOptional()
  @IsString()
  @IsIn(['core', 'kids'])
  contentTarget?: string;

  @ApiPropertyOptional({ enum: ['tr', 'en'] })
  @IsOptional()
  @IsString()
  @IsIn(['tr', 'en'])
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
