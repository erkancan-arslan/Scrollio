/**
 * Classroom Game Controller
 *
 * REST endpoints under /classroom/ for the Bil ve Fethet: Classroom game.
 * All endpoints require authentication via AuthGuard.
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Delete,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ClassroomService } from './classroom.service';
import {
    CreateRoomDto,
    JoinRoomDto,
    StartRoomDto,
    DraftPickDto,
    AttackDto,
    SubmitAnswerDto,
} from './dto';

@Controller('classroom')
@UseGuards(AuthGuard)
export class ClassroomController {
    constructor(private readonly classroomService: ClassroomService) { }

    // =====================================================
    // Matchmaking Queue
    // =====================================================

    /** Join the random 4-player matchmaking queue */
    @Post('queue/join')
    @HttpCode(HttpStatus.OK)
    async joinQueue(@Request() req: any) {
        const userId = req.user.id;
        const displayName = req.user.displayName || req.user.email || 'Player';
        return this.classroomService.joinQueue(userId, displayName);
    }

    /** Instant play with 3 medium bots */
    @Post('quick-play')
    @HttpCode(HttpStatus.OK)
    async quickPlay(@Request() req: any) {
        const userId = req.user.id;
        const displayName = req.user.displayName || req.user.email || 'Player';
        return this.classroomService.quickPlay(userId, displayName);
    }

    /** Leave the matchmaking queue */
    @Delete('queue/leave')
    @HttpCode(HttpStatus.OK)
    async leaveQueue(@Request() req: any) {
        const userId = req.user.id;
        return this.classroomService.leaveQueue(userId);
    }

    // =====================================================
    // Room Management
    // =====================================================

    /** Create a private room */
    @Post('room/create')
    @HttpCode(HttpStatus.CREATED)
    async createRoom(
        @Body() dto: CreateRoomDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        const displayName = req.user.displayName || req.user.email || 'Player';
        return this.classroomService.createRoom(userId, displayName, dto.maxPlayers);
    }

    /** Join a room by code */
    @Post('room/join')
    @HttpCode(HttpStatus.OK)
    async joinRoom(
        @Body() dto: JoinRoomDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        const displayName = req.user.displayName || req.user.email || 'Player';
        return this.classroomService.joinRoom(userId, displayName, dto.roomCode);
    }

    /** Get room state */
    @Get('room/:code')
    @HttpCode(HttpStatus.OK)
    async getRoomState(@Param('code') code: string) {
        return this.classroomService.getRoomState(code);
    }

    /** Host starts the match */
    @Post('room/start')
    @HttpCode(HttpStatus.OK)
    async startRoom(
        @Body() dto: StartRoomDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.classroomService.startRoom(userId, dto.roomCode);
    }

    // =====================================================
    // Match Actions
    // =====================================================

    /** Get current match state (for reconnection) */
    @Get('match/:matchId')
    @HttpCode(HttpStatus.OK)
    async getMatchState(
        @Param('matchId') matchId: string,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.classroomService.getMatchState(userId, matchId);
    }

    /** Submit a draft seat pick */
    @Post('match/draft-pick')
    @HttpCode(HttpStatus.OK)
    async draftPick(
        @Body() dto: DraftPickDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.classroomService.draftPick(userId, dto.matchId, dto.seatIndex);
    }

    /** Select a target seat to attack */
    @Post('match/attack')
    @HttpCode(HttpStatus.OK)
    async attack(
        @Body() dto: AttackDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.classroomService.attack(userId, dto.matchId, dto.targetSeatIndex);
    }

    /** Submit an answer to the current question */
    @Post('match/answer')
    @HttpCode(HttpStatus.OK)
    async submitAnswer(
        @Body() dto: SubmitAnswerDto,
        @Request() req: any,
    ) {
        const userId = req.user.id;
        return this.classroomService.submitAnswer(userId, dto.matchId, dto.score);
    }
}
