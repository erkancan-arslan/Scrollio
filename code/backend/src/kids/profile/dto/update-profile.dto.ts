import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateKidsProfileDto {
  @ApiPropertyOptional({ description: 'Display name for the child' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Child age' })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(17)
  age?: number;

  @ApiPropertyOptional({ description: 'Preferred language' })
  @IsOptional()
  @IsString()
  language?: string;
}
