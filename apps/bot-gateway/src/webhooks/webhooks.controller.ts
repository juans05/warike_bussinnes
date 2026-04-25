import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('events/:restaurantId')
  @UseGuards(JwtBusinessGuard)
  getActivity(@Param('restaurantId') restaurantId: string) {
    return this.webhooksService.getRecentActivity(restaurantId);
  }
}
