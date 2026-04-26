import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import {
  EVENTS,
  ReservaCreatedEvent,
  ReservaConfirmedEvent,
  ReservaCancelledEvent,
} from '../events/domain-events';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreateReservaDto): Promise<Reserva> {
    const reserva = this.reservaRepo.create({ ...dto, status: 'pending' });
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CREATED,
      new ReservaCreatedEvent(
        saved.id, saved.restaurant_id, saved.customer_name,
        saved.party_size, saved.date, saved.time, saved.created_at,
      ),
    );
    return saved;
  }

  findByRestaurant(restaurant_id: string): Promise<Reserva[]> {
    return this.reservaRepo.find({
      where: { restaurant_id },
      order: { created_at: 'DESC' },
    });
  }

  async confirm(id: string, restaurant_id: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({ where: { id, restaurant_id } });
    if (!reserva) throw new NotFoundException('Reserva not found');
    reserva.status = 'confirmed';
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CONFIRMED,
      new ReservaConfirmedEvent(
        saved.id, saved.restaurant_id, saved.customer_name, saved.customer_phone,
        saved.party_size, saved.date, saved.time, new Date(),
      ),
    );
    return saved;
  }

  async cancel(id: string, restaurant_id: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({ where: { id, restaurant_id } });
    if (!reserva) throw new NotFoundException('Reserva not found');
    reserva.status = 'cancelled';
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CANCELLED,
      new ReservaCancelledEvent(saved.id, saved.restaurant_id, new Date()),
    );
    return saved;
  }
}
