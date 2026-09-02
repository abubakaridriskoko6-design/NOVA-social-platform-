import { Router } from 'express';
import { z } from 'zod';
import env from '../config/env.js';
import { hashPassword, hashSessionToken, sanitizeUser, signAccessToken, verifyPassword } from '../lib/auth.js';
import { createUser, getUserByEmail } from '../lib/fallbackStore.js';
import { prisma, isDatabaseAvailable } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  communityRulesAccepted: z.boolean().refine((value) => value === true, {
    message: 'You must accept the NOVA Community & Safety Rules before creating an account.',
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const authRouter = Router();

async function getUserRecordByEmail(email: string) {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });
  }

  return getUserByEmail(email);
}

async function persistUser(record: {
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  status?: string;
  communityRulesAccepted?: boolean;
  communityRulesAcceptedAt?: string | null;
  rulesVersion?: string | null;
}) {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    return prisma.user.create({
      data: {
        email: record.email,
        name: record.name,
        passwordHash: record.passwordHash,
        role: (record.role as 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN') ?? 'USER',
        status: (record.status as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED') ?? 'ACTIVE',
        communityRulesAccepted: Boolean(record.communityRulesAccepted),
        communityRulesAcceptedAt: record.communityRulesAcceptedAt ? new Date(record.communityRulesAcceptedAt) : null,
        rulesVersion: record.rulesVersion ?? 'nova-community-safety-v1',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        communityRulesAccepted: true,
        communityRulesAcceptedAt: true,
        rulesVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  return createUser({
    email: record.email,
    name: record.name,
    passwordHash: record.passwordHash,
    role: (record.role as 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN') ?? 'USER',
    status: (record.status as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED') ?? 'ACTIVE',
    communityRulesAccepted: Boolean(record.communityRulesAccepted),
    communityRulesAcceptedAt: record.communityRulesAcceptedAt ?? (record.communityRulesAccepted ? new Date().toISOString() : null),
    rulesVersion: record.rulesVersion ?? 'nova-community-safety-v1',
  });
}

function buildAuthResponse(res: any, user: { id: string; email: string; name: string; role: string; status: string }, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const safeUser = sanitizeUser(user);
  return res.status(201).json({
    user: safeUser,
    token,
  });
}

async function persistSession(req: any, userId: string, token: string) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip ?? null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existingUser = await getUserRecordByEmail(payload.email);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await persistUser({
      email: payload.email,
      name: payload.name,
      passwordHash,
      communityRulesAccepted: payload.communityRulesAccepted,
      communityRulesAcceptedAt: new Date().toISOString(),
      rulesVersion: 'nova-community-safety-v1',
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await persistSession(req, user.id, token);

    return buildAuthResponse(res, user, token);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const hasCommunityRuleIssue = error.issues.some((issue) => issue.path.includes('communityRulesAccepted') || issue.message.toLowerCase().includes('community') || issue.message.toLowerCase().includes('safety'));

      if (hasCommunityRuleIssue) {
        return res.status(400).json({ message: 'You must accept the NOVA Community & Safety Rules before creating an account.' });
      }

      return res.status(400).json({ message: 'Invalid registration payload.', errors: error.flatten() });
    }

    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await getUserRecordByEmail(payload.email);

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await persistSession(req, user.id, token);

    res.cookie(env.COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: env.COOKIE_SAME_SITE,
      secure: env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid login payload.', errors: error.flatten() });
    }

    return next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  return res.json({ user });
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : req.cookies?.[env.COOKIE_NAME];
    if (token && env.NODE_ENV === 'production') {
      await prisma.session.updateMany({
        where: { tokenHash: hashSessionToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  res.clearCookie(env.COOKIE_NAME);
  return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    return next(error);
  }
});
