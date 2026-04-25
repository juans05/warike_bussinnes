import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtBusinessPayload {
  sub: string;
  email: string;
  role: string;
  aud?: string;
}

@Injectable()
export class JwtBusinessStrategy extends PassportStrategy(Strategy, 'jwt-business') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') ?? '',
      audience: config.get<string>('JWT_AUDIENCE', 'warike-business'),
    });
  }

  validate(payload: JwtBusinessPayload): JwtBusinessPayload {
    if (payload.role !== 'business' && payload.role !== 'admin') {
      throw new UnauthorizedException('Insufficient role: business or admin required');
    }
    return payload;
  }
}
