import { IsString, IsIn, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  deviceType?: 'ios' | 'android' | 'web';
}

export class UnregisterFcmTokenDto {
  @IsString()
  token: string;
}
