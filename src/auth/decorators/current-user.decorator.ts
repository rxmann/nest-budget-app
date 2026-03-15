import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../strategies/jwt.strategy';

export type CurrentUserType = {
  id: string;
  email: string;
  username: string;
  roles: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    return {
      id: user.sub,
      email: user.email,
      roles: user.roles,
      username: user.username,
    } as CurrentUserType;
  },
);
