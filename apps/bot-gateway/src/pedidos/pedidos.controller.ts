import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.create(dto);
  }

  @Get(':restaurantId')
  @UseGuards(JwtBusinessGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.pedidosService.findByRestaurant(restaurantId);
  }

  @Patch(':restaurantId/:id/status/:status')
  @UseGuards(JwtBusinessGuard)
  updateStatus(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    return this.pedidosService.updateStatus(id, restaurantId, status);
  }
}
