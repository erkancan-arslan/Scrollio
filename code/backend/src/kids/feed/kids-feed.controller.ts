import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsFeedService } from './kids-feed.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { GetKidsFeedDto, ViewedEventDto } from './dto';

@ApiTags('kids-feed')
@Controller('kids/feed')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsFeedController {
  constructor(private readonly kidsFeedService: KidsFeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized kids feed' })
  async getFeed(
    @CurrentChild() childId: string,
    @Query() query: GetKidsFeedDto,
  ) {
    return this.kidsFeedService.getFeed(childId, query);
  }

  @Post('viewed')
  @ApiOperation({ summary: 'Track content view event' })
  async trackView(
    @CurrentChild() childId: string,
    @Body() dto: ViewedEventDto,
  ) {
    return this.kidsFeedService.trackView(childId, dto);
  }
}
