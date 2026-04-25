import { PartialType } from '@nestjs/mapped-types';
import { CreateCartaItemDto } from './create-carta-item.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCartaItemDto extends PartialType(CreateCartaItemDto) {
  @IsBoolean()
  @IsOptional()
  available?: boolean;
}
