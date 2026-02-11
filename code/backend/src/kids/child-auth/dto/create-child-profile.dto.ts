import { IsString, IsOptional, MinLength, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
