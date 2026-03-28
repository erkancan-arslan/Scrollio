import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Kesirler' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Kesirlerde toplama ve çıkarma' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({ example: 'Bu derste kesirlerde toplama ve çıkarma işlemleri anlatılacak.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Matematik' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ enum: ['formal', 'friendly', 'energetic'], default: 'friendly' })
  @IsOptional()
  @IsIn(['formal', 'friendly', 'energetic'])
  tone?: string;

  @ApiPropertyOptional({ enum: ['tr', 'en'], default: 'tr' })
  @IsOptional()
  @IsIn(['tr', 'en'])
  language?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classroomId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includesProblemSolving?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  problemCount?: number;
}
