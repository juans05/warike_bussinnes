import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { PedidoLineItem } from '@warike-business/types';

export class PedidoLineItemDto implements PedidoLineItem {
  @IsString()
  item_id: string;

  @IsString()
  @IsOptional()
  variant_id?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsString()
  item_name: string;
}

export class CreatePedidoDto {
  @IsString()
  restaurant_id: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  channel: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoLineItemDto)
  items: PedidoLineItemDto[];

  @IsNumber()
  @Min(0)
  total: number;
}
