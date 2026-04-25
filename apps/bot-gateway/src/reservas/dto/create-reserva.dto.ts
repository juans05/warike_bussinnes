import { IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateReservaDto {
  @IsString()
  restaurant_id: string;

  @IsString()
  customer_name: string;

  @IsString()
  customer_phone: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  party_size: number;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsString()
  session_id: string;

  @IsString()
  channel: string;
}
