import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PrismaService } from '../../prisma/prisma.service';
import { comparePassword } from '../utils/password.util';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      this.logger.warn(`Login failed — user not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      this.logger.warn(`Login failed — wrong password: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.accountLocked) {
      throw new UnauthorizedException('Account inactive or locked');
    }

    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
    };
  }
}
