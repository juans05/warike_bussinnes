import { Injectable } from '@nestjs/common';
import { PedidosService } from '../pedidos/pedidos.service';
import { ReservasService } from '../reservas/reservas.service';
import { FeedbackService } from '../feedback/feedback.service';

export interface ActivityEvent {
  type: 'pedido' | 'reserva' | 'feedback';
  id: string;
  summary: string;
  created_at: string;
  urgent: boolean;
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly reservasService: ReservasService,
    private readonly feedbackService: FeedbackService,
  ) {}

  async getRecentActivity(restaurant_id: string): Promise<ActivityEvent[]> {
    const [pedidos, reservas, feedbacks] = await Promise.all([
      this.pedidosService.findByRestaurant(restaurant_id),
      this.reservasService.findByRestaurant(restaurant_id),
      this.feedbackService.findByRestaurant(restaurant_id),
    ]);

    const events: ActivityEvent[] = [
      ...pedidos.slice(0, 5).map(p => ({
        type: 'pedido' as const,
        id: p.id,
        summary: `Pedido — S/. ${p.total}`,
        created_at: p.created_at.toString(),
        urgent: false,
      })),
      ...reservas.slice(0, 5).map(r => ({
        type: 'reserva' as const,
        id: r.id,
        summary: `Reserva ${r.party_size} personas — ${r.date} ${r.time}`,
        created_at: r.created_at.toString(),
        urgent: r.status === 'pending',
      })),
      ...feedbacks.slice(0, 5).map(f => ({
        type: 'feedback' as const,
        id: f.id,
        summary: f.message.substring(0, 60) + (f.message.length > 60 ? '...' : ''),
        created_at: f.created_at.toString(),
        urgent: f.status === 'pending',
      })),
    ];

    return events
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }
}
