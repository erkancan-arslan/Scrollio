import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsProfileService } from './kids-profile.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { UpdateKidsProfileDto, UpdateAvatarDto, SelectTopicsDto } from './dto';

@ApiTags('kids-profile')
@Controller('kids/profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class KidsProfileController {
  constructor(private readonly kidsProfileService: KidsProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get child profile' })
  async getProfile(@CurrentChild() childId: string) {
    return this.kidsProfileService.getProfile(childId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update child profile' })
  async updateProfile(
    @CurrentChild() childId: string,
    @Body() dto: UpdateKidsProfileDto,
  ) {
    return this.kidsProfileService.updateProfile(childId, dto);
  }

  @Patch('avatar')
  @ApiOperation({ summary: 'Update child avatar' })
  async updateAvatar(
    @CurrentChild() childId: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.kidsProfileService.updateAvatar(childId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get child viewing history' })
  async getHistory(@CurrentChild() childId: string) {
    return this.kidsProfileService.getHistory(childId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get child learning metrics' })
  async getMetrics(@CurrentChild() childId: string) {
    return this.kidsProfileService.getMetrics(childId);
  }

  // ──────────── Topics ────────────

  @Get('topics')
  @ApiOperation({ summary: 'Get all available topics' })
  async getAllTopics() {
    return this.kidsProfileService.getAllTopics();
  }

  @Get('topics/search')
  @ApiOperation({ summary: 'Search topics by name' })
  async searchTopics(@Query('q') query: string) {
    return this.kidsProfileService.searchTopics(query || '');
  }

  @Get('topics/selected')
  @ApiOperation({ summary: 'Get child selected topics' })
  async getSelectedTopics(@CurrentChild() childId: string) {
    return this.kidsProfileService.getSelectedTopics(childId);
  }

  @Post('topics/select')
  @ApiOperation({ summary: 'Set child selected topics' })
  async selectTopics(
    @CurrentChild() childId: string,
    @Body() dto: SelectTopicsDto,
  ) {
    return this.kidsProfileService.selectTopics(childId, dto);
  }
}
