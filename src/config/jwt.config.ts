import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expirationMs: parseInt(process.env.JWT_EXPIRATION_MS ?? '86400000'),
}));
