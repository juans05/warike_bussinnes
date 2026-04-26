import { Controller, Get, Param, Sse, UseGuards } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Sse('stream/:restaurantId')
  @UseGuards(JwtBusinessGuard)
  stream(@Param('restaurantId') restaurantId: string): Observable<MessageEvent> {
    return this.dashboardService
      .getStream(restaurantId)
      .pipe(map(ev => ({ data: ev }) as MessageEvent));
  }
}
