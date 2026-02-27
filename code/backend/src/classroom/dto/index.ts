/**
 * Classroom Game DTOs — Request validation
 */
import { IsString, IsNumber, IsBoolean, Min, Max, IsOptional } from 'class-validator';

export class CreateRoomDto {
    @IsNumber()
    @Min(2)
    @Max(4)
    maxPlayers: number;
}

export class JoinRoomDto {
    @IsString()
    roomCode: string;
}

export class StartRoomDto {
    @IsString()
    roomCode: string;
}

export class DraftPickDto {
    @IsString()
    matchId: string;

    @IsNumber()
    @Min(0)
    @Max(23)
    seatIndex: number;
}

export class AttackDto {
    @IsString()
    matchId: string;

    @IsNumber()
    @Min(0)
    @Max(23)
    targetSeatIndex: number;
}

export class SubmitAnswerDto {
    @IsString()
    matchId: string;

    @IsBoolean()
    answer: boolean;
}

export class GetMatchStateDto {
    @IsString()
    matchId: string;
}
