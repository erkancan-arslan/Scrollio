import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KidsPlaygroundService } from './kids-playground.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { UploadDrawingDto, GenerateMentorDto, GetCharacterParamsDto, GetAnimationParamsDto } from './dto';

@ApiTags('kids-playground')
@Controller('kids/playground')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsPlaygroundController {
  constructor(private readonly kidsPlaygroundService: KidsPlaygroundService) {}

  @Post('drawing')
  @ApiOperation({ summary: 'Upload a drawing from the playground' })
  async uploadDrawing(
    @CurrentChild() childId: string,
    @Body() dto: UploadDrawingDto,
  ) {
    return this.kidsPlaygroundService.uploadDrawing(childId, dto);
  }

  @Post('generate-mentor')
  @ApiOperation({ summary: 'Generate Pixar-style mentor from drawing (FAL image-to-image)' })
  async generateMentor(
    @CurrentChild() childId: string,
    @Body() dto: GenerateMentorDto,
  ) {
    return this.kidsPlaygroundService.generateMentor(
      childId,
      dto.imageBase64,
      dto.childName,
    );
  }

  @Get('character/:id')
  @ApiOperation({ summary: 'Get a specific character' })
  async getCharacter(
    @CurrentChild() childId: string,
    @Param() params: GetCharacterParamsDto,
  ) {
    return this.kidsPlaygroundService.getCharacter(childId, params.id);
  }

  @Get('characters')
  @ApiOperation({ summary: 'Get all available characters' })
  async getCharacters(@CurrentChild() childId: string) {
    return this.kidsPlaygroundService.getCharacters(childId);
  }

  @Get('animation/:id')
  @ApiOperation({ summary: 'Get a specific animation' })
  async getAnimation(
    @CurrentChild() childId: string,
    @Param() params: GetAnimationParamsDto,
  ) {
    return this.kidsPlaygroundService.getAnimation(childId, params.id);
  }
}
