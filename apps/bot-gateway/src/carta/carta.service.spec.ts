import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CartaService } from './carta.service';
import { CartaItem } from './entities/carta-item.entity';
import { CartaCategory } from './entities/carta-category.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

describe('CartaService', () => {
  let service: CartaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartaService,
        { provide: getRepositoryToken(CartaItem), useValue: { ...mockRepo } },
        { provide: getRepositoryToken(CartaCategory), useValue: { ...mockRepo } },
      ],
    }).compile();
    service = module.get<CartaService>(CartaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByRestaurant', () => {
    it('returns items with category relation', async () => {
      const items = [{ id: '1', name: 'Ceviche', restaurant_id: 'r1' }];
      mockRepo.find.mockResolvedValue(items);
      const result = await service.findAllByRestaurant('r1');
      expect(result).toEqual(items);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { restaurant_id: 'r1' },
        relations: ['category'],
      });
    });
  });

  describe('toggleAvailability', () => {
    it('flips available from true to false', async () => {
      const item = { id: '1', available: true, restaurant_id: 'r1' };
      mockRepo.findOne.mockResolvedValue(item);
      mockRepo.save.mockResolvedValue({ ...item, available: false });
      const result = await service.toggleAvailability('1', 'r1');
      expect(result.available).toBe(false);
    });

    it('throws NotFoundException when item not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleAvailability('bad', 'r1')).rejects.toThrow(NotFoundException);
    });
  });
});
