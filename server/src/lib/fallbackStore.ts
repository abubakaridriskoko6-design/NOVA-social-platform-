import env from '../config/env.js';

type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED';

export type FallbackUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  communityRulesAccepted: boolean;
  communityRulesAcceptedAt: string | null;
  rulesVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FallbackAdminAction = {
  id: string;
  actorId: string;
  targetUserId: string | null;
  actionType: string;
  details?: string | null;
  createdAt: string;
};

export type FallbackAppeal = {
  id: string;
  userId: string;
  originalAction: string;
  reason: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED';
  reviewerId: string | null;
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __novaFallbackUserStore?: FallbackUser[];
  __novaFallbackAdminActions?: FallbackAdminAction[];
  __novaFallbackAppeals?: FallbackAppeal[];
};

function assertFallbackStorageAllowed() {
  if (env.NODE_ENV === 'production') {
    throw new Error('In-memory fallback storage is disabled in production.');
  }
}

if (!globalStore.__novaFallbackUserStore) {
  globalStore.__novaFallbackUserStore = [];
}
if (!globalStore.__novaFallbackAdminActions) {
  globalStore.__novaFallbackAdminActions = [];
}
if (!globalStore.__novaFallbackAppeals) {
  globalStore.__novaFallbackAppeals = [];
}

export const fallbackStore = {
  list() {
    assertFallbackStorageAllowed();
    return [...globalStore.__novaFallbackUserStore!];
  },
  listAdminActions() {
    assertFallbackStorageAllowed();
    return [...globalStore.__novaFallbackAdminActions!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  listAppeals() {
    assertFallbackStorageAllowed();
    return [...globalStore.__novaFallbackAppeals!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  clear() {
    assertFallbackStorageAllowed();
    globalStore.__novaFallbackUserStore = [];
    globalStore.__novaFallbackAdminActions = [];
    globalStore.__novaFallbackAppeals = [];
  },
  create(user: Omit<FallbackUser, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    assertFallbackStorageAllowed();
    const now = new Date().toISOString();
    const record: FallbackUser = {
      id: user.id ?? `user_${globalStore.__novaFallbackUserStore!.length + 1}`,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      communityRulesAccepted: user.communityRulesAccepted,
      communityRulesAcceptedAt: user.communityRulesAcceptedAt ?? (user.communityRulesAccepted ? now : null),
      rulesVersion: user.rulesVersion ?? null,
      createdAt: now,
      updatedAt: now,
    };

    globalStore.__novaFallbackUserStore!.push(record);
    return { ...record };
  },
  updateUser(id: string, updates: Partial<Pick<FallbackUser, 'role' | 'status' | 'name' | 'email'>>) {
    assertFallbackStorageAllowed();
    const index = globalStore.__novaFallbackUserStore!.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }

    const next = { ...globalStore.__novaFallbackUserStore![index], ...updates, updatedAt: new Date().toISOString() };
    globalStore.__novaFallbackUserStore![index] = next;
    return { ...next };
  },
  createAdminAction(action: { actorId: string; targetUserId?: string | null; actionType: string; details?: string | null }) {
    assertFallbackStorageAllowed();
    const record: FallbackAdminAction = {
      id: `admin_action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      actorId: action.actorId,
      targetUserId: action.targetUserId ?? null,
      actionType: action.actionType,
      details: action.details ?? null,
      createdAt: new Date().toISOString(),
    };
    globalStore.__novaFallbackAdminActions!.push(record);
    return { ...record };
  },
  createAppeal(appeal: Omit<FallbackAppeal, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    assertFallbackStorageAllowed();
    const record: FallbackAppeal = {
      id: appeal.id ?? `appeal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: appeal.userId,
      originalAction: appeal.originalAction,
      reason: appeal.reason,
      status: appeal.status,
      reviewerId: appeal.reviewerId ?? null,
      reviewerNote: appeal.reviewerNote ?? null,
      createdAt: appeal.createdAt ?? new Date().toISOString(),
      reviewedAt: appeal.reviewedAt ?? null,
    };
    globalStore.__novaFallbackAppeals!.push(record);
    return { ...record };
  },
  findAppeal(id: string) {
    assertFallbackStorageAllowed();
    return globalStore.__novaFallbackAppeals!.find((appeal) => appeal.id === id) ?? null;
  },
  findByEmail(email: string) {
    assertFallbackStorageAllowed();
    return globalStore.__novaFallbackUserStore!.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },
  findById(id: string) {
    assertFallbackStorageAllowed();
    return globalStore.__novaFallbackUserStore!.find((user) => user.id === id);
  },
};

export function getUserByEmail(email: string) {
  return fallbackStore.findByEmail(email);
}

export function findUserById(id: string) {
  return fallbackStore.findById(id);
}

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
  status?: UserStatus;
  communityRulesAccepted?: boolean;
  communityRulesAcceptedAt?: string | null;
  rulesVersion?: string | null;
}) {
  return fallbackStore.create({
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    role: input.role ?? 'USER',
    status: input.status ?? 'ACTIVE',
    communityRulesAccepted: input.communityRulesAccepted ?? false,
    communityRulesAcceptedAt: input.communityRulesAcceptedAt ?? (input.communityRulesAccepted ? new Date().toISOString() : null),
    rulesVersion: input.rulesVersion ?? null,
  });
}
