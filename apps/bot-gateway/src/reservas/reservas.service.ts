import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
  ) {}

  create(dto: CreateReservaDto): Promise<Reserva> {
    const reserva = this.reservaRepo.create({ ...dto, status: 'pending' });
    return this.reservaRepo.save(reserva);
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
    return this.reservaRepo.save(reserva);
  }

  async cancel(id: string, restaurant_id: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({ where: { id, restaurant_id } });
    if (!reserva) throw new NotFoundException('Reserva not found');
    reserva.status = 'cancelled';
    return this.reservaRepo.save(reserva);
  }
}
