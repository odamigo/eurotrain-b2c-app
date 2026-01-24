import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class CreateBookingDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  offerLocations: string[];
}
