import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { EVENTS, FeedbackReceivedEvent, FeedbackResolvedEvent } from '../events/domain-events';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepo.create({ ...dto, status: 'pending' });
    const saved = await this.feedbackRepo.save(feedback);
    this.emitter.emit(
      EVENTS.FEEDBACK_RECEIVED,
      new FeedbackReceivedEvent(
        saved.id, saved.restaurant_id, saved.message,
        saved.sentiment_score ?? null, saved.channel, saved.anonymous, saved.created_at,
      ),
    );
    return saved;
  }

  findByRestaurant(restaurant_id: string, status?: string): Promise<Feedback[]> {
    const where: Record<string, string> = { restaurant_id };
    if (status) where['status'] = status;
    return this.feedbackRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async resolve(id: string, restaurant_id: string): Promise<Feedback> {
    const fb = await this.feedbackRepo.findOne({ where: { id, restaurant_id } });
    if (!fb) throw new NotFoundException('Feedback not found');
    fb.status = 'resolved';
    const saved = await this.feedbackRepo.save(fb);
    this.emitter.emit(
      EVENTS.FEEDBACK_RESOLVED,
      new FeedbackResolvedEvent(saved.id, saved.restaurant_id, new Date()),
    );
    return saved;
  }
}
