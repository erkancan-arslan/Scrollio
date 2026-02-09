import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FcmService } from './fcm.service';
import { RegisterFcmTokenDto, UnregisterFcmTokenDto } from './dto';

@Controller('fcm')
@UseGuards(AuthGuard)
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  /**
   * Register FCM token
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerToken(@Body() registerDto: RegisterFcmTokenDto, @Request() req: any) {
    const userId = req.user.id;
    return this.fcmService.registerToken(
      userId,
      registerDto.token,
      registerDto.deviceId,
      registerDto.deviceType,
    );
  }

  /**
   * Unregister FCM token (on logout)
   */
  @Delete('unregister')
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Body() unregisterDto: UnregisterFcmTokenDto) {
    return this.fcmService.unregisterToken(unregisterDto.token);
  }
}
