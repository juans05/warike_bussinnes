import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtBusinessGuard } from './jwt-business.guard';
import { JwtBusinessPayload } from './jwt-business.strategy';

@Controller('auth')
export class AuthController {
  @Get('verify')
  @UseGuards(JwtBusinessGuard)
  verify(@Request() req: { user: JwtBusinessPayload }) {
    return { valid: true, user: req.user };
  }
}
