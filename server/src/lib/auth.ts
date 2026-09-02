import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(payload: { sub: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as {
    sub: string;
    email: string;
    role: string;
  };
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function sanitizeUser<T extends Record<string, unknown>>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user as T & { passwordHash?: string };
  return safeUser;
}
