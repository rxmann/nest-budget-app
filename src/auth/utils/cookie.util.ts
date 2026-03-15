import { Response, Request } from 'express';

const COOKIE_NAME = 'access_token';
const COOKIE_PATH = '/';
const ONE_DAY_SECONDS = 60 * 60 * 24;

export function setAuthCookie(
  res: Response,
  token: string,
  isDev: boolean,
): void {
  // manually build Set-Cookie for SameSite=None support
  const cookieHeader = [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${ONE_DAY_SECONDS}`,
    `Path=${COOKIE_PATH}`,
    `HttpOnly`,
    `SameSite=None`,
    isDev ? '' : 'Secure',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookieHeader);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    path: COOKIE_PATH,
    sameSite: 'none',
  });
}

export function extractTokenFromCookie(req: Request): string | null {
  return req.cookies?.[COOKIE_NAME] ?? null;
}
