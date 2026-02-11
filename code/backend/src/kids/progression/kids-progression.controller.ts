import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsProgressionService } from './kids-progression.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { GetProgressQueryDto, CompleteMissionParamsDto, CompleteMissionDto } from './dto';

@ApiTags('kids-progression')
@Controller('kids/progression')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsProgressionController {
  constructor(private readonly kidsProgressionService: KidsProgressionService) {}

  @Get()
  @ApiOperation({ summary: 'Get child progression overview' })
  async getProgress(
    @CurrentChild() childId: string,
    @Query() query: GetProgressQueryDto,
  ) {
    return this.kidsProgressionService.getProgress(childId, query);
  }

  @Get('missions/daily')
  @ApiOperation({ summary: 'Get daily missions for child' })
  async getDailyMissions(@CurrentChild() childId: string) {
    return this.kidsProgressionService.getDailyMissions(childId);
  }

  @Post('missions/:id/complete')
  @ApiOperation({ summary: 'Mark a mission as complete' })
  async completeMission(
    @CurrentChild() childId: string,
    @Param() params: CompleteMissionParamsDto,
    @Body() dto: CompleteMissionDto,
  ) {
    return this.kidsProgressionService.completeMission(childId, params.id, dto);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get available and earned rewards' })
  async getRewards(@CurrentChild() childId: string) {
    return this.kidsProgressionService.getRewards(childId);
  }
}
