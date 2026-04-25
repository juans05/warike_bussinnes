import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('ReservasService', () => {
  let service: ReservasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: getRepositoryToken(Reserva), useValue: { ...mockRepo } },
      ],
    }).compile();
    service = module.get<ReservasService>(ReservasService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves reserva with status pending', async () => {
      const dto = {
        restaurant_id: 'r1', customer_name: 'Juan', customer_phone: '999',
        party_size: 2, date: '2026-04-26', time: '19:00', session_id: 's1', channel: 'whatsapp',
      };
      mockRepo.create.mockReturnValue({ ...dto, status: 'pending' });
      mockRepo.save.mockResolvedValue({ ...dto, id: 'uuid-1', status: 'pending' });
      const result = await service.create(dto);
      expect(result.status).toBe('pending');
    });
  });

  describe('confirm', () => {
    it('sets status to confirmed', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', status: 'pending', restaurant_id: 'r1' });
      mockRepo.save.mockResolvedValue({ id: '1', status: 'confirmed', restaurant_id: 'r1' });
      const result = await service.confirm('1', 'r1');
      expect(result.status).toBe('confirmed');
    });

    it('throws NotFoundException when reserva not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.confirm('bad', 'r1')).rejects.toThrow(NotFoundException);
    });
  });
});
