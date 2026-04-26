import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import {
  EVENTS,
  PedidoCreatedEvent, PedidoStatusChangedEvent,
  ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent,
  FeedbackReceivedEvent, FeedbackResolvedEvent,
} from '../events/domain-events';

type DomainEvent =
  | PedidoCreatedEvent | PedidoStatusChangedEvent
  | ReservaCreatedEvent | ReservaConfirmedEvent | ReservaCancelledEvent
  | FeedbackReceivedEvent | FeedbackResolvedEvent;

@Injectable()
export class AuditListener {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  private async log(eventName: string, entityId: string, restaurantId: string, payload: DomainEvent) {
    const entry = this.auditRepo.create({
      event_name: eventName,
      restaurant_id: restaurantId,
      entity_id: entityId,
      payload: payload as unknown as Record<string, unknown>,
    });
    await this.auditRepo.save(entry);
  }

  @OnEvent(EVENTS.PEDIDO_CREATED)
  onPedidoCreated(ev: PedidoCreatedEvent) {
    return this.log(EVENTS.PEDIDO_CREATED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.PEDIDO_STATUS_CHANGED)
  onPedidoStatusChanged(ev: PedidoStatusChangedEvent) {
    return this.log(EVENTS.PEDIDO_STATUS_CHANGED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CREATED)
  onReservaCreated(ev: ReservaCreatedEvent) {
    return this.log(EVENTS.RESERVA_CREATED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  onReservaConfirmed(ev: ReservaConfirmedEvent) {
    return this.log(EVENTS.RESERVA_CONFIRMED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CANCELLED)
  onReservaCancelled(ev: ReservaCancelledEvent) {
    return this.log(EVENTS.RESERVA_CANCELLED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  onFeedbackReceived(ev: FeedbackReceivedEvent) {
    return this.log(EVENTS.FEEDBACK_RECEIVED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.FEEDBACK_RESOLVED)
  onFeedbackResolved(ev: FeedbackResolvedEvent) {
    return this.log(EVENTS.FEEDBACK_RESOLVED, ev.id, ev.restaurant_id, ev);
  }
}
