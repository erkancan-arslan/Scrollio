import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** PNG data URL from the app canvas (data:image/png;base64,...). */
export class CreateKidsCustomMascotJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12_000_000)
  imageBase64!: string;
}
