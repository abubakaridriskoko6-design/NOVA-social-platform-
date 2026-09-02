import { Router } from 'express';
import { z } from 'zod';
import { prisma, isDatabaseAvailable } from '../lib/prisma.js';
import { socialStore } from '../lib/socialStore.js';
import { requireAuth } from '../middleware/auth.js';

const planSchema = z.object({
  slug: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(120),
  priceCents: z.number().int().min(0),
  currency: z.string().trim().length(3).optional(),
  interval: z.enum(['month', 'year']).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

const checkoutSchema = z.object({
  planId: z.string().min(1),
  provider: z.string().trim().min(2).max(40).default('manual'),
});

const subscriptionRouter = Router();

subscriptionRouter.get('/plans', async (_req, res) => {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: 'asc' },
    });

    return res.json({ plans });
  }

  return res.json({
    plans: socialStore.state.subscriptionPlans.filter((plan) => plan.isActive).map((plan) => ({
      ...plan,
    })),
  });
});

subscriptionRouter.post('/plans', requireAuth, async (req, res) => {
  const currentUser = req.user!;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    return res.status(403).json({ message: 'Only administrators can configure plans.' });
  }

  const payload = planSchema.parse(req.body ?? {});
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        slug: payload.slug,
        name: payload.name,
        priceCents: payload.priceCents,
        currency: payload.currency ?? 'USD',
        interval: payload.interval ?? 'month',
        description: payload.description ?? null,
        isActive: payload.isActive ?? true,
      },
    });

    return res.status(201).json({ plan });
  }

  const plan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    slug: payload.slug,
    name: payload.name,
    priceCents: payload.priceCents,
    currency: payload.currency ?? 'USD',
    interval: payload.interval ?? 'month',
    description: payload.description ?? null,
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  socialStore.state.subscriptionPlans.push(plan);
  return res.status(201).json({ plan });
});

subscriptionRouter.get('/subscriptions/me', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ subscriptions });
  }

  return res.json({
    subscriptions: socialStore.state.subscriptions.filter((subscription) => subscription.userId === userId),
  });
});

subscriptionRouter.post('/subscriptions', requireAuth, async (req, res) => {
  const payload = checkoutSchema.parse(req.body ?? {});
  const userId = req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: payload.planId, isActive: true } });
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found or inactive.' });
    }

    const existing = await prisma.subscription.findFirst({ where: { userId, planId: plan.id, status: { in: ['ACTIVE', 'TRIALING'] } } });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active subscription for this plan.' });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'year' ? 12 : 1));
    const result = await prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.create({
        data: { userId, planId: plan.id, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd },
        include: { plan: true },
      });
      const payment = await transaction.payment.create({
        data: { subscriptionId: subscription.id, userId, provider: payload.provider, amountCents: plan.priceCents, currency: plan.currency, status: 'PAID' },
      });
      return { subscription, payment };
    });
    return res.status(201).json(result);
  }

  const plan = socialStore.state.subscriptionPlans.find((entry) => entry.id === payload.planId && entry.isActive);
  if (!plan) return res.status(404).json({ message: 'Subscription plan not found or inactive.' });
  const now = new Date().toISOString();
  const subscription = {
    id: `subscription_${Date.now()}`,
    userId,
    planId: plan.id,
    status: 'ACTIVE' as const,
    currentPeriodStart: now,
    currentPeriodEnd: null,
    createdAt: now,
    updatedAt: now,
  };
  socialStore.state.subscriptions.push(subscription);
  const payment = {
    id: `payment_${Date.now()}`,
    subscriptionId: subscription.id,
    userId,
    provider: payload.provider,
    providerReference: null,
    amountCents: plan.priceCents,
    currency: plan.currency,
    status: 'PAID' as const,
    createdAt: now,
  };
  socialStore.state.payments.push(payment);
  return res.status(201).json({ subscription: { ...subscription, plan }, payment });
});

subscriptionRouter.post('/subscriptions/:id/cancel', requireAuth, async (req, res) => {
  const subscriptionId = String(req.params.id);
  const userId = req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const subscription = await prisma.subscription.findFirst({ where: { id: subscriptionId, userId } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found.' });
    const updated = await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'CANCELLED', currentPeriodEnd: subscription.currentPeriodEnd ?? new Date() }, include: { plan: true } });
    return res.json({ subscription: updated });
  }

  const subscription = socialStore.state.subscriptions.find((entry) => entry.id === subscriptionId && entry.userId === userId);
  if (!subscription) return res.status(404).json({ message: 'Subscription not found.' });
  subscription.status = 'CANCELLED';
  subscription.currentPeriodEnd = subscription.currentPeriodEnd ?? new Date().toISOString();
  subscription.updatedAt = new Date().toISOString();
  return res.json({ subscription });
});

export { subscriptionRouter };
