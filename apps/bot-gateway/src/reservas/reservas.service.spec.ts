import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { EVENTS, ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
const mockEmitter = { emit: jest.fn() };

const baseReserva = {
  id: 'rv-1', restaurant_id: 'r-1', customer_name: 'Juan', customer_phone: '999',
  party_size: 2, date: '2026-05-01', time: '19:00', status: 'pending',
  session_id: 's-1', channel: 'web_widget', created_at: new Date(),
};

describe('ReservasService — events', () => {
  let service: ReservasService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: getRepositoryToken(Reserva), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(ReservasService);
  });

  it('create() emits reserva.created', async () => {
    mockRepo.create.mockReturnValue(baseReserva);
    mockRepo.save.mockResolvedValue(baseReserva);

    await service.create({
      restaurant_id: 'r-1', customer_name: 'Juan', customer_phone: '999',
      party_size: 2, date: '2026-05-01', time: '19:00',
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CREATED, expect.any(ReservaCreatedEvent));
    const ev: ReservaCreatedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(ev.customer_name).toBe('Juan');
    expect(ev.party_size).toBe(2);
  });

  it('confirm() emits reserva.confirmed', async () => {
    const confirmed = { ...baseReserva, status: 'confirmed' };
    mockRepo.findOne.mockResolvedValue(baseReserva);
    mockRepo.save.mockResolvedValue(confirmed);

    await service.confirm('rv-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CONFIRMED, expect.any(ReservaConfirmedEvent));
  });

  it('cancel() emits reserva.cancelled', async () => {
    const cancelled = { ...baseReserva, status: 'cancelled' };
    mockRepo.findOne.mockResolvedValue(baseReserva);
    mockRepo.save.mockResolvedValue(cancelled);

    await service.cancel('rv-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CANCELLED, expect.any(ReservaCancelledEvent));
  });

  it('confirm() throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.confirm('x', 'r-1')).rejects.toThrow(NotFoundException);
  });
});
