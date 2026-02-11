import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({ description: 'Avatar identifier or URL' })
  @IsString()
  avatarId: string;

  @ApiPropertyOptional({ description: 'Custom avatar color' })
  @IsOptional()
  @IsString()
  color?: string;
}
