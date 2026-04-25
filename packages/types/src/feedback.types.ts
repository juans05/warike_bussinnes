import { Channel } from './restaurant.types';

export type FeedbackStatus = 'pending' | 'noted' | 'resolved';

export interface CreateFeedbackPayload {
  restaurant_id: string;
  session_id?: string;
  message: string;
  sentiment_score: number;
  channel: Channel;
  anonymous: boolean;
  customer_name?: string;
  customer_phone?: string;
}

export interface Feedback extends CreateFeedbackPayload {
  id: string;
  status: FeedbackStatus;
  created_at: string;
}
