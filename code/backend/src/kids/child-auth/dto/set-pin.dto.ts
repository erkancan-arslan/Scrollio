import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPinDto {
  @ApiProperty({ description: 'Parent PIN (4-6 digits)' })
  @IsString()
  @Length(4, 6)
  pin: string;
}
