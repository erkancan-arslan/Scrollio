import { IsString, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';

export class SubmitDuelAnswerDto {
    @IsString()
    @IsNotEmpty()
    matchId: string;

    @IsNumber()
    questionIndex: number;

    @IsBoolean()
    answer: boolean;

    @IsNumber()
    clientTimestamp: number;
}
