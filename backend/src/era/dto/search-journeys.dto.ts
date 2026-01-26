import { IsString, IsOptional, IsNumber, IsDateString, Min, IsBoolean, IsEnum } from 'class-validator';

export enum TripType {
  ONEWAY = 'oneway',
  ROUNDTRIP = 'roundtrip',
}

export class SearchJourneysDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsEnum(TripType)
  tripType?: TripType = TripType.ONEWAY;

  @IsOptional()
  @IsNumber()
  @Min(1)
  adults?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  youths?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  seniors?: number = 0;

  @IsOptional()
  @IsString()
  class?: 'standard' | 'comfort' | 'premier';

  @IsOptional()
  @IsBoolean()
  directOnly?: boolean = false;
}
