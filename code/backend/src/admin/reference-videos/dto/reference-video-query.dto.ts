import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReferenceVideoQueryDto {
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

  @ApiPropertyOptional({ enum: ['ready', 'processing', 'failed'] })
  @IsOptional()
  @IsString()
  @IsIn(['ready', 'processing', 'failed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['reference', 'brainrot'] })
  @IsOptional()
  @IsString()
  @IsIn(['reference', 'brainrot'])
  type?: string;

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
