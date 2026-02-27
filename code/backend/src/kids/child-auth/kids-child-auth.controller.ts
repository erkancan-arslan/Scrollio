import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsChildAuthService } from './kids-child-auth.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
  SwitchChildProfileDto,
  SetPinDto,
  VerifyPinDto,
  UpgradeRoleDto,
  RegisterParentDto,
  LoginDto,
} from './dto';

interface AuthenticatedRequest {
  user?: { id: string; email?: string; displayName?: string };
}

@ApiTags('kids-auth')
@Controller('kids/auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class KidsChildAuthController {
  constructor(private readonly kidsChildAuthService: KidsChildAuthService) {}

  // ──────────── Public (no auth required) ────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new parent account' })
  async register(@Body() dto: RegisterParentDto) {
    return this.kidsChildAuthService.registerParent(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to Kids' })
  async login(@Body() dto: LoginDto) {
    return this.kidsChildAuthService.login(dto);
  }

  // ──────────── Authenticated (JWT required) ────────────

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile and roles' })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.kidsChildAuthService.getMe(req.user!.id);
  }

  @Post('upgrade-role')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Upgrade user role to parent' })
  async upgradeRole(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpgradeRoleDto,
  ) {
    return this.kidsChildAuthService.upgradeRole(req.user!.id, dto);
  }

  // ──────────── Parent-only (JWT + role) ────────────

  @Post('pin/set')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @ApiOperation({ summary: 'Set parent PIN' })
  async setPin(@Req() req: AuthenticatedRequest, @Body() dto: SetPinDto) {
    return this.kidsChildAuthService.setPin(req.user!.id, dto);
  }

  @Post('pin/verify')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @ApiOperation({ summary: 'Verify parent PIN' })
  async verifyPin(@Req() req: AuthenticatedRequest, @Body() dto: VerifyPinDto) {
    return this.kidsChildAuthService.verifyPin(req.user!.id, dto);
  }

  @Get('children')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @ApiOperation({ summary: 'List all child profiles' })
  async getChildren(@Req() req: AuthenticatedRequest) {
    return this.kidsChildAuthService.getChildren(req.user!.id);
  }

  @Post('children')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new child profile' })
  async createChild(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateChildProfileDto,
  ) {
    return this.kidsChildAuthService.createChild(req.user!.id, dto);
  }

  @Patch('children/:childId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @ApiOperation({ summary: 'Update a child profile' })
  async updateChild(
    @Req() req: AuthenticatedRequest,
    @Param('childId') childId: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    return this.kidsChildAuthService.updateChild(req.user!.id, childId, dto);
  }

  @Delete('children/:childId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a child profile' })
  async deleteChild(
    @Req() req: AuthenticatedRequest,
    @Param('childId') childId: string,
  ) {
    return this.kidsChildAuthService.deleteChild(req.user!.id, childId);
  }

  @Post('children/switch')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('parent', 'school')
  @ApiOperation({ summary: 'Switch active child profile' })
  async switchChild(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SwitchChildProfileDto,
  ) {
    return this.kidsChildAuthService.switchChild(req.user!.id, dto);
  }
}
