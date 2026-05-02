import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  UpdateProfileDto,
  ProfileDto,
  PublicProfileDto,
  FollowResponseDto,
  XpResponseDto,
  StreakResponseDto,
  WeeklyAnalyticsDto,
} from './dto';

interface AuthenticatedRequest {
  user: { id: string; email?: string; displayName?: string };
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /profile/me/weekly-analytics
   * Get the current user's weekly analytics
   * Authentication: Required
   */
  @Get('me/weekly-analytics')
  @UseGuards(AuthGuard)
  async getWeeklyAnalytics(
    @Req() req: AuthenticatedRequest,
  ): Promise<WeeklyAnalyticsDto> {
    return this.profileService.getWeeklyAnalytics(req.user.id);
  }

  /**
   * GET /profile/me
   * Get the current user's profile
   * Authentication: Required
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMyProfile(@Req() req: AuthenticatedRequest): Promise<ProfileDto> {
    return this.profileService.getMyProfile(req.user.id);
  }

  /**
   * PUT /profile/me
   * Update the current user's profile
   * Authentication: Required
   */
  @Put('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.profileService.updateProfile(req.user.id, updateData);
  }

  /**
   * GET /profile/username/:username
   * Get a user's profile by username
   * Authentication: Optional (for isFollowing status)
   */
  @Get('username/:username')
  async getProfileByUsername(
    @Param('username') username: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PublicProfileDto> {
    const userId = req.user?.id || null;
    return this.profileService.getProfileByUsername(userId, username);
  }

  /**
   * GET /profile/:userId
   * Get a user's public profile
   * Authentication: Optional (for isFollowing status)
   */
  @Get(':userId')
  async getProfile(
    @Param('userId') profileId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PublicProfileDto> {
    const userId = req.user?.id || null;
    return this.profileService.getProfile(userId, profileId);
  }

  /**
   * POST /profile/:userId/follow
   * Follow a user
   * Authentication: Required
   */
  @Post(':userId/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async followUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
  ): Promise<FollowResponseDto> {
    return this.profileService.followUser(req.user.id, targetUserId);
  }

  /**
   * DELETE /profile/:userId/follow
   * Unfollow a user
   * Authentication: Required
   */
  @Delete(':userId/follow')
  @UseGuards(AuthGuard)
  async unfollowUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
  ): Promise<FollowResponseDto> {
    return this.profileService.unfollowUser(req.user.id, targetUserId);
  }

  /**
   * GET /profile/:userId/followers
   * Get a user's followers
   * Authentication: Not required
   */
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') profileId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ users: PublicProfileDto[]; total: number }> {
    return this.profileService.getFollowers(profileId, limit || 20, offset || 0);
  }

  /**
   * GET /profile/:userId/following
   * Get users that a profile is following
   * Authentication: Not required
   */
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') profileId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ users: PublicProfileDto[]; total: number }> {
    return this.profileService.getFollowing(profileId, limit || 20, offset || 0);
  }

  /**
   * POST /profile/me/xp
   * Add XP to current user (internal use)
   * Authentication: Required
   */
  @Post('me/xp')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async addXp(
    @Req() req: AuthenticatedRequest,
    @Body('amount') amount: number,
  ): Promise<XpResponseDto> {
    return this.profileService.addXp(req.user.id, amount);
  }

  /**
   * POST /profile/me/streak
   * Update user streak (call when user opens app)
   * Authentication: Required
   */
  @Post('me/streak')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStreak(@Req() req: AuthenticatedRequest): Promise<StreakResponseDto> {
    return this.profileService.updateStreak(req.user.id);
  }
}


