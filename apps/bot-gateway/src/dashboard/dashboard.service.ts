import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  EVENTS,
  PedidoCreatedEvent, PedidoStatusChangedEvent,
  ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent,
  FeedbackReceivedEvent,
} from '../events/domain-events';

export interface DashboardEvent {
  type: string;
  restaurant_id: string;
  id: string;
  summary: string;
  urgent: boolean;
  ts: string;
}

@Injectable()
export class DashboardService {
  private readonly stream$ = new Subject<DashboardEvent>();

  getStream(restaurant_id: string) {
    return this.stream$.pipe(filter(ev => ev.restaurant_id === restaurant_id));
  }

  private push(ev: DashboardEvent) {
    this.stream$.next(ev);
  }

  @OnEvent(EVENTS.PEDIDO_CREATED)
  onPedidoCreated(ev: PedidoCreatedEvent) {
    this.push({
      type: 'pedido.created',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Nuevo pedido S/. ${ev.total} — ${ev.channel}`,
      urgent: false,
      ts: ev.created_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.PEDIDO_STATUS_CHANGED)
  onPedidoStatusChanged(ev: PedidoStatusChangedEvent) {
    this.push({
      type: 'pedido.status_changed',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Pedido ${ev.id.slice(0, 8)}: ${ev.old_status} → ${ev.new_status}`,
      urgent: ev.new_status === 'cancelled',
      ts: ev.changed_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CREATED)
  onReservaCreated(ev: ReservaCreatedEvent) {
    this.push({
      type: 'reserva.created',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Nueva reserva — ${ev.customer_name} — ${ev.party_size} personas — ${ev.date} ${ev.time}`,
      urgent: true,
      ts: ev.created_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  onReservaConfirmed(ev: ReservaConfirmedEvent) {
    this.push({
      type: 'reserva.confirmed',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Reserva confirmada — ${ev.customer_name} — ${ev.date} ${ev.time}`,
      urgent: false,
      ts: ev.confirmed_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CANCELLED)
  onReservaCancelled(ev: ReservaCancelledEvent) {
    this.push({
      type: 'reserva.cancelled',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Reserva cancelada #${ev.id.slice(0, 8)}`,
      urgent: false,
      ts: ev.cancelled_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  onFeedbackReceived(ev: FeedbackReceivedEvent) {
    this.push({
      type: 'feedback.received',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: ev.message.substring(0, 80) + (ev.message.length > 80 ? '...' : ''),
      urgent: true,
      ts: ev.received_at.toISOString(),
    });
  }
}
