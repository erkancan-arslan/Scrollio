import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsVoiceService } from './kids-voice.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { VoiceCommandDto } from './dto';

@ApiTags('kids-voice')
@Controller('kids/voice')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsVoiceController {
  constructor(private readonly kidsVoiceService: KidsVoiceService) {}

  @Post('command')
  @ApiOperation({ summary: 'Process a voice command' })
  async processCommand(
    @CurrentChild() childId: string,
    @Body() dto: VoiceCommandDto,
  ) {
    return this.kidsVoiceService.processCommand(childId, dto);
  }
}
