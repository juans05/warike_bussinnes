import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, IsObject } from 'class-validator';
import type { DietaryInfo, PairingInfo, ItemVariant } from '@warike-business/types';

export class CreateCartaItemDto {
  @IsString()
  category_id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_chef_recommendation?: boolean;

  @IsString()
  @IsOptional()
  chef_note?: string;

  @IsArray()
  @IsOptional()
  allergens?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  dietary?: DietaryInfo;

  @IsObject()
  @IsOptional()
  pairing?: PairingInfo;

  @IsArray()
  @IsOptional()
  variants?: ItemVariant[];

  @IsNumber()
  @IsOptional()
  prep_time_minutes?: number;
}
