import { 
  IsArray, 
  IsString, 
  IsOptional, 
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TravelerDocumentDto {
  @IsString()
  type: 'PASSPORT' | 'ID_CARD' | 'DRIVING_LICENSE';

  @IsString()
  number: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class TravelerInputDto {
  @IsString()
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TravelerDocumentDto)
  document?: TravelerDocumentDto;
}

export class UpdateTravelersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerInputDto)
  @ArrayMinSize(1)
  travelers: TravelerInputDto[];
}
