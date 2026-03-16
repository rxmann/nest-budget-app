import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto, LoginResponseDto } from './dto/auth-response.dto';
import { hashPassword } from './utils/password.util';
import { setAuthCookie, clearAuthCookie } from './utils/cookie.util';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { AuthProviderType } from '../../generated/prisma/client';
import { CurrentUserType } from './decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    // check email uniqueness
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    // check username uniqueness
    const usernameExists = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });
    if (usernameExists) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        roles: ['USER'],
        authProviderType: AuthProviderType.EMAIL,
        isActive: true,
        accountLocked: false,
      },
    });

    this.logger.log(`User registered: ${user.id} — ${user.email}`);

    return { id: user.id, email: user.email, username: user.username };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(payload: JwtPayload, res: Response): Promise<LoginResponseDto> {
    const token = this.generateToken(payload);
    const isDev = this.config.get<string>('app.nodeEnv') === 'development';

    setAuthCookie(res, token, isDev);

    this.logger.log(`User logged in: ${payload.sub} — ${payload.email}`);

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles,
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  logout(res: Response): void {
    clearAuthCookie(res);
    this.logger.log('User logged out — cookie cleared');
  }

  // ─── Google OAuth2 ─────────────────────────────────────────────────────────

  async handleGoogleLogin(
    profile: GoogleProfile,
    res: Response,
  ): Promise<LoginResponseDto> {
    // try find by providerId first
    let user = await this.prisma.user.findFirst({
      where: {
        providerId: profile.providerId,
        authProviderType: AuthProviderType.GOOGLE,
      },
    });

    if (!user) {
      // check if email exists under a different provider
      const emailUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (emailUser) {
        this.logger.warn(
          `OAuth2 email conflict: ${profile.email} exists under ${emailUser.authProviderType}`,
        );
        throw new UnauthorizedException(
          `Email already registered with ${emailUser.authProviderType}`,
        );
      }

      // auto-register new google user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username,
          passwordHash: null,
          providerId: profile.providerId,
          authProviderType: AuthProviderType.GOOGLE,
          roles: ['USER'],
          isActive: true,
          accountLocked: false,
        },
      });

      this.logger.log(
        `Google user auto-registered: ${user.id} — ${user.email}`,
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
    };

    const token = this.generateToken(payload);
    const isDev = this.config.get<string>('app.nodeEnv') === 'development';

    setAuthCookie(res, token, isDev);

    this.logger.log(`Google login success: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
    };
  }

  async getProfile(user: CurrentUserType) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        roles: true,
        authProviderType: true,
        createdAt: true,
      },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generateToken(payload: JwtPayload): string {
    return this.jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
        roles: payload.roles,
      },
      {
        expiresIn: this.config.getOrThrow<number>('jwt.expirationMs'),
      },
    );
  }
}
