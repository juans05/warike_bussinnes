import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS, PedidoCreatedEvent, ReservaConfirmedEvent, FeedbackReceivedEvent } from '../events/domain-events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  @OnEvent(EVENTS.PEDIDO_CREATED)
  handlePedidoCreated(ev: PedidoCreatedEvent) {
    // Extension point: connect Twilio (SMS), FCM (push), or SendGrid (email) here
    this.logger.log(
      `[NOTIF] Nuevo pedido #${ev.id.slice(0, 8)} — Restaurant ${ev.restaurant_id} — S/. ${ev.total} — Canal: ${ev.channel}`,
    );
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  handleReservaConfirmed(ev: ReservaConfirmedEvent) {
    this.logger.log(
      `[NOTIF] Reserva confirmada #${ev.id.slice(0, 8)} — ${ev.customer_name} — ${ev.party_size} personas — ${ev.date} ${ev.time}`,
    );
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  handleFeedbackReceived(ev: FeedbackReceivedEvent) {
    this.logger.warn(
      `[NOTIF] Feedback recibido #${ev.id.slice(0, 8)} — Restaurant ${ev.restaurant_id} — Score: ${ev.sentiment_score ?? 'N/A'}`,
    );
  }
}
