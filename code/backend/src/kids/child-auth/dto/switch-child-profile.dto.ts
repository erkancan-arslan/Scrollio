import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchChildProfileDto {
  @ApiProperty({ description: 'UUID of the child profile to switch to' })
  @IsUUID()
  childId: string;
}
