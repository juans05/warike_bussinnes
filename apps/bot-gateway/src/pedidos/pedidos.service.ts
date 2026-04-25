import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
  ) {}

  create(dto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepo.create({ ...dto, status: 'pending' });
    return this.pedidoRepo.save(pedido);
  }

  findByRestaurant(restaurant_id: string): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      where: { restaurant_id },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: string, restaurant_id: string, status: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id, restaurant_id } });
    if (!pedido) throw new NotFoundException('Pedido not found');
    pedido.status = status;
    return this.pedidoRepo.save(pedido);
  }
}
