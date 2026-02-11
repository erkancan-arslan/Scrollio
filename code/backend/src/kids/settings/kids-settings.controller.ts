import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsSettingsService } from './kids-settings.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { UpdateSettingsDto } from './dto';

@ApiTags('kids-settings')
@Controller('kids/settings')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsSettingsController {
  constructor(private readonly kidsSettingsService: KidsSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notification and app settings for child' })
  async getSettings(@CurrentChild() childId: string) {
    return this.kidsSettingsService.getSettings(childId);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification settings for child' })
  async updateNotifications(
    @CurrentChild() childId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.kidsSettingsService.updateNotifications(childId, dto);
  }
}
