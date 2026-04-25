import { Channel } from './restaurant.types';

export type ReservaStatus = 'pending' | 'confirmed' | 'cancelled';

export interface CreateReservaPayload {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  date: string;
  time: string;
  session_id: string;
  channel: Channel;
}

export interface Reserva extends CreateReservaPayload {
  id: string;
  status: ReservaStatus;
  created_at: string;
}
