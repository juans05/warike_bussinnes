import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PedidosService } from './pedidos.service';
import { Pedido } from './entities/pedido.entity';
import { EVENTS, PedidoCreatedEvent, PedidoStatusChangedEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockEmitter = { emit: jest.fn() };

describe('PedidosService — events', () => {
  let service: PedidosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: getRepositoryToken(Pedido), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(PedidosService);
  });

  it('create() emits pedido.created with correct payload', async () => {
    const saved = {
      id: 'p-1', restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      items: [{ name: 'Lomo', price: 35, quantity: 1 }], total: 35,
      status: 'pending', created_at: new Date(), updated_at: new Date(),
    };
    mockRepo.create.mockReturnValue(saved);
    mockRepo.save.mockResolvedValue(saved);

    await service.create({
      restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      items: [{ name: 'Lomo', price: 35, quantity: 1 }], total: 35,
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EVENTS.PEDIDO_CREATED,
      expect.any(PedidoCreatedEvent),
    );
    const emitted: PedidoCreatedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(emitted.id).toBe('p-1');
    expect(emitted.restaurant_id).toBe('r-1');
    expect(emitted.total).toBe(35);
  });

  it('updateStatus() emits pedido.status_changed', async () => {
    const existing = { id: 'p-1', restaurant_id: 'r-1', status: 'pending', items: [], total: 35, created_at: new Date(), updated_at: new Date() };
    const updated = { ...existing, status: 'preparing' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue(updated);

    await service.updateStatus('p-1', 'r-1', 'preparing');

    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EVENTS.PEDIDO_STATUS_CHANGED,
      expect.any(PedidoStatusChangedEvent),
    );
    const emitted: PedidoStatusChangedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(emitted.old_status).toBe('pending');
    expect(emitted.new_status).toBe('preparing');
  });

  it('updateStatus() throws NotFoundException if pedido not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.updateStatus('x', 'r-1', 'preparing')).rejects.toThrow(NotFoundException);
    expect(mockEmitter.emit).not.toHaveBeenCalled();
  });
});
