import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPinDto {
  @ApiProperty({ description: 'Parent PIN to verify (4-6 digits)' })
  @IsString()
  @Length(4, 6)
  pin: string;
}
