import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartaService } from './carta.service';
import { CreateCartaItemDto } from './dto/create-carta-item.dto';
import { UpdateCartaItemDto } from './dto/update-carta-item.dto';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('carta')
@UseGuards(JwtBusinessGuard)
export class CartaController {
  constructor(private readonly cartaService: CartaService) {}

  @Get(':restaurantId')
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.cartaService.findAllByRestaurant(restaurantId);
  }

  @Get(':restaurantId/categories')
  findCategories(@Param('restaurantId') restaurantId: string) {
    return this.cartaService.findCategories(restaurantId);
  }

  @Post(':restaurantId')
  create(@Param('restaurantId') restaurantId: string, @Body() dto: CreateCartaItemDto) {
    return this.cartaService.create(restaurantId, dto);
  }

  @Patch(':restaurantId/items/:id')
  update(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartaItemDto,
  ) {
    return this.cartaService.update(id, restaurantId, dto);
  }

  @Patch(':restaurantId/items/:id/toggle')
  toggleAvailability(@Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.cartaService.toggleAvailability(id, restaurantId);
  }

  @Delete(':restaurantId/items/:id')
  remove(@Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.cartaService.remove(id, restaurantId);
  }
}
