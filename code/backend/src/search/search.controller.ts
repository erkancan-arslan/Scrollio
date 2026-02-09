import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SearchService } from './search.service';
import { SearchUsersDto } from './dto';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query() searchDto: SearchUsersDto, @Request() req: any) {
    const userId = req.user.id;
    return this.searchService.searchUsers(
      userId,
      searchDto.query,
      searchDto.limit,
    );
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Request() req: any, @Query('id') targetUserId: string) {
    const userId = req.user.id;
    return this.searchService.getUserById(userId, targetUserId);
  }
}
