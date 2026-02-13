import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDuelRequestDto {
    @IsString()
    @IsNotEmpty()
    toUserId: string;
}
