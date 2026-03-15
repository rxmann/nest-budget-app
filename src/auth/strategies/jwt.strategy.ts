import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { extractTokenFromCookie } from '../utils/cookie.util';

export type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  roles: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // extract token from cookie, fall back to Bearer header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractTokenFromCookie(req),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // lightweight check — user still exists and not locked
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, accountLocked: true },
    });

    if (!user || !user.isActive || user.accountLocked) {
      this.logger.warn(`JWT rejected for user: ${payload.sub}`);
      throw new UnauthorizedException('Account inactive or locked');
    }

    // whatever is returned here lands on request.user
    return payload;
  }
}
