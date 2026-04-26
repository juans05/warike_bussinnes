import { PedidoLineItem } from '@warike-business/types';

export class PedidoCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly session_id: string,
    public readonly channel: string,
    public readonly items: PedidoLineItem[],
    public readonly total: number,
    public readonly created_at: Date,
  ) {}
}

export class PedidoStatusChangedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly old_status: string,
    public readonly new_status: string,
    public readonly changed_at: Date,
  ) {}
}

export class ReservaCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly customer_name: string,
    public readonly party_size: number,
    public readonly date: string,
    public readonly time: string,
    public readonly created_at: Date,
  ) {}
}

export class ReservaConfirmedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly customer_name: string,
    public readonly customer_phone: string,
    public readonly party_size: number,
    public readonly date: string,
    public readonly time: string,
    public readonly confirmed_at: Date,
  ) {}
}

export class ReservaCancelledEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly cancelled_at: Date,
  ) {}
}

export class FeedbackReceivedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly message: string,
    public readonly sentiment_score: number | null,
    public readonly channel: string,
    public readonly anonymous: boolean,
    public readonly received_at: Date,
  ) {}
}

export class FeedbackResolvedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly resolved_at: Date,
  ) {}
}

export const EVENTS = {
  PEDIDO_CREATED: 'pedido.created',
  PEDIDO_STATUS_CHANGED: 'pedido.status_changed',
  RESERVA_CREATED: 'reserva.created',
  RESERVA_CONFIRMED: 'reserva.confirmed',
  RESERVA_CANCELLED: 'reserva.cancelled',
  FEEDBACK_RECEIVED: 'feedback.received',
  FEEDBACK_RESOLVED: 'feedback.resolved',
} as const;
