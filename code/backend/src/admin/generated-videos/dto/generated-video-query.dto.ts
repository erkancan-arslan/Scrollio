import { IsOptional, IsString, IsIn, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratedVideoQueryDto {
  @ApiPropertyOptional({ enum: ['core', 'kids'] })
  @IsOptional()
  @IsString()
  @IsIn(['core', 'kids'])
  contentTarget?: string;

  @ApiPropertyOptional({ enum: ['active', 'hidden', 'archived'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'hidden', 'archived'])
  status?: string;

  @ApiPropertyOptional({ enum: ['tr', 'en'] })
  @IsOptional()
  @IsString()
  @IsIn(['tr', 'en'])
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by originating generation job id' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

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
