import { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'ied_at';
export const REFRESH_COOKIE = 'ied_rt';

export interface AuthCookiePayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function attachAuthCookies(res: Response, session: AuthCookiePayload) {
  const base = baseOptions();
  res.cookie(ACCESS_COOKIE, session.accessToken, {
    ...base,
    maxAge: Math.max(session.expiresIn, 60) * 1000,
  });
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  const base = baseOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
