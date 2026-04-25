import { JwtBusinessGuard } from './jwt-business.guard';
import { Reflector } from '@nestjs/core';

describe('JwtBusinessGuard', () => {
  let guard: JwtBusinessGuard;

  beforeEach(() => {
    guard = new JwtBusinessGuard(new Reflector());
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
