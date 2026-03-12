import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { AuthGuard } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { FeedQueryDto, BookmarkedFeedQueryDto, LikedFeedQueryDto, WatchedFeedQueryDto } from './dto/feed-query.dto';
import { VideoIdParamDto, RecordViewDto } from './dto/video-action.dto';
import {
  FeedResponseDto,
  TopicsResponseDto,
  ActionResponseDto,
  VideoDto,
} from './dto/feed-response.dto';

interface AuthenticatedRequest {
  user?: { id: string; email?: string; displayName?: string };
}

/**
 * Optional auth guard - allows both authenticated and unauthenticated requests
 * Sets req.user if authenticated, undefined otherwise
 */
@Injectable()
class OptionalAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true; // Allow unauthenticated
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return true; // Allow if malformed (treat as unauthenticated)
    }

    try {
      const supabase = this.supabaseService.getClientWithAuth(token);
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        request.user = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name,
        };
      }
    } catch {
      // Ignore errors - treat as unauthenticated
    }

    return true;
  }
}

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * GET /feed
   * Get personalized video feed
   * Authentication: Optional (personalization requires auth)
   */
  @Get()
  @UseGuards(OptionalAuthGuard)
  async getFeed(
    @Req() req: AuthenticatedRequest,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const userId = req.user?.id || null;
    return this.feedService.getFeed(userId, query);
  }

  /**
   * GET /feed/bookmarks
   * Get user's bookmarked videos
   * Authentication: Required
   */
  @Get('bookmarks')
  @UseGuards(AuthGuard)
  async getBookmarkedFeed(
    @Req() req: AuthenticatedRequest,
    @Query() query: BookmarkedFeedQueryDto,
  ): Promise<FeedResponseDto> {
    return this.feedService.getBookmarkedFeed(req.user!.id, query);
  }

  /**
   * GET /feed/likes
   * Get user's liked videos
   * Authentication: Required
   */
  @Get('likes')
  @UseGuards(AuthGuard)
  async getLikedFeed(
    @Req() req: AuthenticatedRequest,
    @Query() query: LikedFeedQueryDto,
  ): Promise<FeedResponseDto> {
    return this.feedService.getLikedFeed(req.user!.id, query);
  }

  /**
   * GET /feed/watched
   * Get user's watched videos (deduplicated history)
   * Authentication: Required
   */
  @Get('watched')
  @UseGuards(AuthGuard)
  async getWatchedFeed(
    @Req() req: AuthenticatedRequest,
    @Query() query: WatchedFeedQueryDto,
  ): Promise<FeedResponseDto> {
    return this.feedService.getWatchedFeed(req.user!.id, query);
  }

  /**
   * GET /feed/topics
   * Get all active topics
   * Authentication: Not required
   */
  @Get('topics')
  async getTopics(): Promise<TopicsResponseDto> {
    return this.feedService.getTopics();
  }

  /**
   * GET /feed/videos/:videoId
   * Get a single video by ID
   * Authentication: Optional
   */
  @Get('videos/:videoId')
  @UseGuards(OptionalAuthGuard)
  async getVideo(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
  ): Promise<VideoDto> {
    const userId = req.user?.id || null;
    return this.feedService.getVideoById(userId, params.videoId);
  }

  /**
   * POST /feed/videos/:videoId/like
   * Like a video
   * Authentication: Required
   */
  @Post('videos/:videoId/like')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async likeVideo(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
  ): Promise<ActionResponseDto> {
    return this.feedService.likeVideo(req.user!.id, params.videoId);
  }

  /**
   * DELETE /feed/videos/:videoId/like
   * Unlike a video
   * Authentication: Required
   */
  @Delete('videos/:videoId/like')
  @UseGuards(AuthGuard)
  async unlikeVideo(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
  ): Promise<ActionResponseDto> {
    return this.feedService.unlikeVideo(req.user!.id, params.videoId);
  }

  /**
   * POST /feed/videos/:videoId/bookmark
   * Bookmark a video
   * Authentication: Required
   */
  @Post('videos/:videoId/bookmark')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async bookmarkVideo(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
  ): Promise<ActionResponseDto> {
    return this.feedService.bookmarkVideo(req.user!.id, params.videoId);
  }

  /**
   * DELETE /feed/videos/:videoId/bookmark
   * Remove bookmark from a video
   * Authentication: Required
   */
  @Delete('videos/:videoId/bookmark')
  @UseGuards(AuthGuard)
  async unbookmarkVideo(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
  ): Promise<ActionResponseDto> {
    return this.feedService.unbookmarkVideo(req.user!.id, params.videoId);
  }

  /**
   * POST /feed/videos/:videoId/view
   * Record a video view
   * Authentication: Optional (anonymous views allowed)
   */
  @Post('videos/:videoId/view')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async recordView(
    @Req() req: AuthenticatedRequest,
    @Param() params: VideoIdParamDto,
    @Body() viewData: RecordViewDto,
  ): Promise<ActionResponseDto> {
    const userId = req.user?.id || null;
    return this.feedService.recordView(userId, params.videoId, viewData);
  }
}

