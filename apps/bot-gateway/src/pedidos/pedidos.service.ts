import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { EVENTS, PedidoCreatedEvent, PedidoStatusChangedEvent } from '../events/domain-events';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepo.create({ ...dto, status: 'pending' });
    const saved = await this.pedidoRepo.save(pedido);
    this.emitter.emit(
      EVENTS.PEDIDO_CREATED,
      new PedidoCreatedEvent(
        saved.id, saved.restaurant_id, saved.session_id,
        saved.channel, saved.items, Number(saved.total), saved.created_at,
      ),
    );
    return saved;
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
    const old_status = pedido.status;
    pedido.status = status;
    const saved = await this.pedidoRepo.save(pedido);
    this.emitter.emit(
      EVENTS.PEDIDO_STATUS_CHANGED,
      new PedidoStatusChangedEvent(saved.id, saved.restaurant_id, old_status, status, new Date()),
    );
    return saved;
  }
}
