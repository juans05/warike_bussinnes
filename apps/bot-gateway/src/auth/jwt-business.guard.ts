import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtBusinessGuard extends AuthGuard('jwt-business') {}
