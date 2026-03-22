import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BilVeFethetService } from './bil-ve-fethet.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('bil-ve-fethet')
@UseGuards(AuthGuard)
export class BilVeFethetController {
  constructor(private readonly service: BilVeFethetService) {}

  @Post('rooms')
  createRoom(@Request() req: any, @Body() body: { displayName?: string }) {
    const { id, displayName } = req.user;
    return this.service.createRoom(id, body.displayName || displayName || 'Oyuncu');
  }

  @Post('rooms/:code/join')
  joinRoom(
    @Request() req: any,
    @Param('code') code: string,
    @Body() body: { displayName?: string },
  ) {
    const { id, displayName } = req.user;
    return this.service.joinRoom(code.toUpperCase(), id, body.displayName || displayName || 'Oyuncu');
  }

  @Get('rooms/:code')
  getRoom(@Param('code') code: string) {
    return this.service.getRoom(code.toUpperCase());
  }

  @Post('rooms/:code/start')
  startRoom(@Request() req: any, @Param('code') code: string) {
    this.service.startRoom(code.toUpperCase(), req.user.id);
    return { success: true };
  }

  @Delete('rooms/:code')
  leaveRoom(@Request() req: any, @Param('code') code: string) {
    this.service.leaveRoom(code.toUpperCase(), req.user.id);
    return { success: true };
  }
}
