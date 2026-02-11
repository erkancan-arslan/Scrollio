import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCharacterParamsDto {
  @ApiProperty({ description: 'UUID of the character' })
  @IsUUID()
  id: string;
}

export class GetAnimationParamsDto {
  @ApiProperty({ description: 'UUID of the animation' })
  @IsUUID()
  id: string;
}
