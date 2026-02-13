import { IsString, IsIn } from 'class-validator';

export class RespondDuelRequestDto {
    @IsString()
    @IsIn(['accept', 'reject', 'cancel'])
    action: 'accept' | 'reject' | 'cancel';
}
