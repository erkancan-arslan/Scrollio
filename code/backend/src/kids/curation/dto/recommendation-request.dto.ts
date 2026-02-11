import { IsOptional, IsInt, IsUUID, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendationRequestDto {
  @ApiPropertyOptional({ description: 'Topic ID to filter recommendations' })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Maximum number of recommendations' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Age group filter' })
  @IsOptional()
  @IsString()
  ageGroup?: string;
}
