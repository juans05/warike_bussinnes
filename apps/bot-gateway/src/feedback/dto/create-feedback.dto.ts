import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  restaurant_id: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  message: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  sentiment_score: number;

  @IsString()
  channel: string;

  @IsBoolean()
  anonymous: boolean;

  @IsString()
  @IsOptional()
  customer_name?: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;
}
