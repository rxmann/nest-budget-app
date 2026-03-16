import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  CurrentUserType,
} from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { GoogleProfile } from './strategies/google.strategy';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ─── Email/Password ────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @UseGuards(AuthGuard('local')) // local strategy validates creds, sets req.user
  @HttpCode(HttpStatus.OK)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // req.user is set by LocalStrategy.validate()
    return this.authService.login(req.user as JwtPayload, res);
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.authService.logout(res);
  }

  // ─── Google OAuth2 ─────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // guard redirects to google — nothing to do here
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.handleGoogleLogin(req.user as GoogleProfile, res);
  }

  // ─── Me ────────────────────────────────────────────────────────────────────

  @Get('profile')
  profile(@CurrentUser() user: CurrentUserType) {
    return this.authService.getProfile(user);
  }
}
