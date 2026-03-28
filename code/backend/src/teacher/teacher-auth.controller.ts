import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TeacherAuthService, TeacherAuthResponse } from './teacher-auth.service';
import { TeacherSignUpDto, TeacherSignInDto } from './dto';

@ApiTags('teacher-auth')
@Controller('teacher/auth')
export class TeacherAuthController {
  constructor(private readonly authService: TeacherAuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new teacher account' })
  @ApiBody({ type: TeacherSignUpDto })
  @ApiResponse({ status: 201, description: 'Teacher registered' })
  async signUp(@Body() dto: TeacherSignUpDto): Promise<TeacherAuthResponse> {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in as teacher' })
  @ApiBody({ type: TeacherSignInDto })
  @ApiResponse({ status: 200, description: 'Signed in' })
  async signIn(@Body() dto: TeacherSignInDto): Promise<TeacherAuthResponse> {
    return this.authService.signIn(dto);
  }
}
