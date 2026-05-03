import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsParentalService } from './kids-parental.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ParentPinGuard } from '../../auth/parent-pin.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { SetScreenTimeDto, UpdateContentFiltersDto } from './dto';

@ApiTags('kids-parental')
@Controller('kids/parental')
@UseGuards(AuthGuard, RolesGuard, ParentPinGuard)
@Roles('parent', 'school')
export class KidsParentalController {
  constructor(private readonly kidsParentalService: KidsParentalService) {}

  @Get('activity')
  @ApiOperation({ summary: 'Get child activity log' })
  async getActivity(@CurrentChild() childId: string) {
    return this.kidsParentalService.getActivity(childId);
  }

  @Get('screen-time')
  @ApiOperation({ summary: 'Get screen time settings and usage' })
  async getScreenTime(@CurrentChild() childId: string) {
    return this.kidsParentalService.getScreenTime(childId);
  }

  @Patch('screen-time')
  @ApiOperation({ summary: 'Update screen time settings' })
  async setScreenTime(
    @CurrentChild() childId: string,
    @Body() dto: SetScreenTimeDto,
  ) {
    return this.kidsParentalService.setScreenTime(childId, dto);
  }

  @Get('content-filters')
  @ApiOperation({ summary: 'Get content filter settings' })
  async getContentFilters(@CurrentChild() childId: string) {
    return this.kidsParentalService.getContentFilters(childId);
  }

  @Patch('content-filters')
  @ApiOperation({ summary: 'Update content filter settings' })
  async updateContentFilters(
    @CurrentChild() childId: string,
    @Body() dto: UpdateContentFiltersDto,
  ) {
    return this.kidsParentalService.updateContentFilters(childId, dto);
  }

  @Get('media-engagement')
  @ApiOperation({ summary: 'Get videos the child has watched, liked, and bookmarked' })
  async getMediaEngagement(@CurrentChild() childId: string) {
    return this.kidsParentalService.getMediaEngagement(childId);
  }

  @Get('watch-time-summary')
  @ApiOperation({ summary: 'Get daily, weekly, and monthly watch time totals' })
  async getWatchTimeSummary(@CurrentChild() childId: string) {
    return this.kidsParentalService.getWatchTimeSummary(childId);
  }

  @Get('quiz-performance')
  @ApiOperation({ summary: 'Get quiz performance percentage grouped by topic' })
  async getQuizPerformance(@CurrentChild() childId: string) {
    return this.kidsParentalService.getQuizPerformance(childId);
  }

  @Get('weekly-report')
  @ApiOperation({ summary: 'Get this week\'s full usage report for the dashboard' })
  async getWeeklyReport(@CurrentChild() childId: string) {
    return this.kidsParentalService.getWeeklyReportForDashboard(childId);
  }

  @Get('progress-history')
  @ApiOperation({ summary: 'Get daily progress history for the last 30 days' })
  async getProgressHistory(@CurrentChild() childId: string) {
    return this.kidsParentalService.getProgressHistory(childId);
  }
}
