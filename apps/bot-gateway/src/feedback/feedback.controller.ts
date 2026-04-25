import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

// There is intentionally NO endpoint that publishes feedback to Wuarike reviews — private channel invariant.
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get(':restaurantId')
  @UseGuards(JwtBusinessGuard)
  findAll(@Param('restaurantId') restaurantId: string, @Query('status') status?: string) {
    return this.feedbackService.findByRestaurant(restaurantId, status);
  }

  @Patch(':restaurantId/:id/resolve')
  @UseGuards(JwtBusinessGuard)
  resolve(@Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.feedbackService.resolve(id, restaurantId);
  }
}
