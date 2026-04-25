import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: { ...mockRepo } },
      ],
    }).compile();
    service = module.get<FeedbackService>(FeedbackService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves feedback with status pending', async () => {
      const dto = {
        restaurant_id: 'r1', message: 'Mal servicio',
        sentiment_score: 0.1, channel: 'whatsapp', anonymous: false,
      };
      mockRepo.create.mockReturnValue({ ...dto, status: 'pending' });
      mockRepo.save.mockResolvedValue({ ...dto, id: 'f1', status: 'pending' });
      const result = await service.create(dto);
      expect(result.status).toBe('pending');
    });
  });

  describe('resolve', () => {
    it('sets status to resolved', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'f1', status: 'pending', restaurant_id: 'r1' });
      mockRepo.save.mockResolvedValue({ id: 'f1', status: 'resolved', restaurant_id: 'r1' });
      const result = await service.resolve('f1', 'r1');
      expect(result.status).toBe('resolved');
    });

    it('throws NotFoundException when feedback not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.resolve('bad', 'r1')).rejects.toThrow(NotFoundException);
    });
  });
});
