import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

export type GoogleProfile = {
  providerId: string;
  email: string;
  username: string;
  displayName: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_SECRET_KEY'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleProfile> {
    const email = profile.emails?.[0]?.value;

    this.logger.debug(`Google OAuth profile received: ${email}`);

    // returned value lands on request.user
    return {
      providerId: profile.id,
      email: email ?? '',
      username: email ?? profile.id,
      displayName: profile.displayName,
    };
  }
}
