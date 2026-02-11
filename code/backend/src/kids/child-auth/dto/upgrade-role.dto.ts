import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeRoleDto {
  @ApiProperty({ description: 'Target role to upgrade to', enum: ['parent', 'school'] })
  @IsString()
  @IsIn(['parent', 'school'])
  targetRole: string;
}
