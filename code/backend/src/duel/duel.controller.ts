import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DuelService } from './duel.service';
import {
    CreateDuelRequestDto,
    RespondDuelRequestDto,
    SubmitDuelAnswerDto,
    UseDuelJokerDto,
    JoinMatchDto,
} from './dto';

@Controller('duel')
@UseGuards(AuthGuard)
export class DuelController {
    constructor(private readonly duelService: DuelService) { }

    /**
     * Create a duel request targeting a friend
     */
    @Post('request')
    @HttpCode(HttpStatus.CREATED)
    async createDuelRequest(
        @Body() dto: CreateDuelRequestDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.createDuelRequest(userId, dto.toUserId);
    }

    /**
     * Respond to a duel request (accept / reject / cancel)
     */
    @Patch('request/:requestId')
    @HttpCode(HttpStatus.OK)
    async respondDuelRequest(
        @Param('requestId') requestId: string,
        @Body() dto: RespondDuelRequestDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.respondDuelRequest(userId, requestId, dto.action);
    }

    /**
     * Submit an answer during a duel match
     */
    @Post('answer')
    @HttpCode(HttpStatus.OK)
    async submitDuelAnswer(
        @Body() dto: SubmitDuelAnswerDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.submitDuelAnswer(
            userId,
            dto.matchId,
            dto.questionIndex,
            dto.answer,
        );
    }

    /**
     * Get current match state (for reconnection)
     */
    @Get('match/:matchId')
    @HttpCode(HttpStatus.OK)
    async getDuelMatchState(
        @Param('matchId') matchId: string,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.getDuelMatchState(userId, matchId);
    }

    /**
     * Get pending incoming duel requests
     */
    @Get('requests/pending')
    @HttpCode(HttpStatus.OK)
    async getPendingDuelRequests(@Request() req: any) {
        const userId = req.user.id;
        return this.duelService.getPendingDuelRequests(userId);
    }

    /**
     * Use a joker during a duel match
     */
    @Post('joker')
    @HttpCode(HttpStatus.OK)
    async useDuelJoker(
        @Body() dto: UseDuelJokerDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.useDuelJoker(userId, dto.matchId, dto.jokerId);
    }

    /**
     * Join a match and signal readiness
     */
    @Post('join')
    @HttpCode(HttpStatus.OK)
    async joinMatch(
        @Body() dto: JoinMatchDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.duelService.joinMatch(userId, dto.matchId);
    }
}
