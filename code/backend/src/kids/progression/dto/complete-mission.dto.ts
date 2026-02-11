import { IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteMissionParamsDto {
  @ApiProperty({ description: 'UUID of the mission to complete' })
  @IsUUID()
  id: string;
}

export class CompleteMissionDto {
  @ApiPropertyOptional({ description: 'Additional proof/evidence data for mission completion' })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;
}
