import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ReservasModule } from '../reservas/reservas.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PedidosModule, ReservasModule, FeedbackModule, AuthModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
