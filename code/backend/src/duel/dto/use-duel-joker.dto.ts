import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UseDuelJokerDto {
    @IsString()
    @IsNotEmpty()
    matchId: string;

    @IsString()
    @IsIn(['SHIELD', 'FREEZE', 'CLEANSE'])
    jokerId: 'SHIELD' | 'FREEZE' | 'CLEANSE';
}
