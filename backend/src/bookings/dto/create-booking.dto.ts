import { IsString, IsEmail, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// Passenger Card DTO
export class PassengerCardDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  number?: string;
}

// Traveler DTO
export class TravelerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  type: 'adult' | 'child' | 'youth' | 'senior';

  @IsString()
  @IsOptional()
  seatPreference?: 'window' | 'aisle' | 'any';

  @IsString()
  @IsOptional()
  passportNumber?: string;

  @IsString()
  @IsOptional()
  passportExpiry?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @ValidateNested()
  @Type(() => PassengerCardDto)
  @IsOptional()
  discountCard?: PassengerCardDto;
}

export class CreateBookingDto {
  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  fromStation: string;

  @IsString()
  toStation: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  promoCode?: string;

  // Journey details - camelCase
  @IsDateString()
  @IsOptional()
  departureDate?: string;

  @IsString()
  @IsOptional()
  departureTime?: string;

  @IsString()
  @IsOptional()
  arrivalTime?: string;

  @IsString()
  @IsOptional()
  trainNumber?: string;

  @IsString()
  @IsOptional()
  operator?: string;

  // Travelers with discount cards
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerDto)
  @IsOptional()
  travelers?: TravelerDto[];
}
