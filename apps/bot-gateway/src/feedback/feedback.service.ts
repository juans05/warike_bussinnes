import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  create(dto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepo.create({ ...dto, status: 'pending' });
    return this.feedbackRepo.save(feedback);
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
    return this.feedbackRepo.save(fb);
  }
}
