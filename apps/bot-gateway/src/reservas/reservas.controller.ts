import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  create(@Body() dto: CreateReservaDto) {
    return this.reservasService.create(dto);
  }

  @Get(':restaurantId')
  @UseGuards(JwtBusinessGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.reservasService.findByRestaurant(restaurantId);
  }

  @Patch(':restaurantId/:id/confirm')
  @UseGuards(JwtBusinessGuard)
  confirm(@Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservasService.confirm(id, restaurantId);
  }

  @Patch(':restaurantId/:id/cancel')
  @UseGuards(JwtBusinessGuard)
  cancel(@Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservasService.cancel(id, restaurantId);
  }
}
