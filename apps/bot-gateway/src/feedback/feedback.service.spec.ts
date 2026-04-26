import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { EVENTS, FeedbackReceivedEvent, FeedbackResolvedEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
const mockEmitter = { emit: jest.fn() };

const baseFeedback = {
  id: 'fb-1', restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
  message: 'El servicio estuvo mal', sentiment_score: 0.1,
  anonymous: false, customer_name: 'Ana', customer_phone: null,
  status: 'pending', created_at: new Date(),
};

describe('FeedbackService — events', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(FeedbackService);
  });

  it('create() emits feedback.received', async () => {
    mockRepo.create.mockReturnValue(baseFeedback);
    mockRepo.save.mockResolvedValue(baseFeedback);

    await service.create({
      restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      message: 'El servicio estuvo mal', sentiment_score: 0.1,
      anonymous: false, customer_name: 'Ana',
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.FEEDBACK_RECEIVED, expect.any(FeedbackReceivedEvent));
    const ev: FeedbackReceivedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(ev.anonymous).toBe(false);
    expect(ev.message).toBe('El servicio estuvo mal');
  });

  it('resolve() emits feedback.resolved', async () => {
    const resolved = { ...baseFeedback, status: 'resolved' };
    mockRepo.findOne.mockResolvedValue(baseFeedback);
    mockRepo.save.mockResolvedValue(resolved);

    await service.resolve('fb-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.FEEDBACK_RESOLVED, expect.any(FeedbackResolvedEvent));
  });

  it('resolve() throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.resolve('x', 'r-1')).rejects.toThrow(NotFoundException);
  });
});
