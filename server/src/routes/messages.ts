import { Router } from 'express';
import { z } from 'zod';
import { prisma, isDatabaseAvailable } from '../lib/prisma.js';
import { socialStore } from '../lib/socialStore.js';
import { requireAuth, requireActiveAccountIfAuthenticated } from '../middleware/auth.js';
import { reviewContentForSafety } from '../lib/moderation.js';
import { emitConversationEvent, subscribeToUserEvents } from '../lib/realtime.js';
import { findUserById } from '../lib/fallbackStore.js';

const createConversationSchema = z.object({
  participantId: z.string().min(1),
  name: z.string().trim().max(120).optional(),
});

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  status: z.enum(['SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
});

const canViewConversation = async (conversationId: string, userId: string) => {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });
    return Boolean(participant);
  }

  return socialStore.state.conversationParticipants.some(
    (participant) => participant.conversationId === conversationId && participant.userId === userId,
  );
};

const isBlocked = async (userId: string, targetUserId: string) => {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const [userBlocked, targetBlocked] = await Promise.all([
      prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } }, select: { id: true } }),
      prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: userId } }, select: { id: true } }),
    ]);
    return Boolean(userBlocked || targetBlocked);
  }

  return socialStore.state.blocks.some(
    (block) => (block.blockerId === userId && block.blockedId === targetUserId) || (block.blockerId === targetUserId && block.blockedId === userId),
  );
};

const messageToPublicShape = (message: any) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  text: message.deletedAt ? '[deleted]' : message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  readAt: message.readAt,
  deletedAt: message.deletedAt,
  status: message.status,
});

export const messagesRouter = Router();

messagesRouter.use(requireActiveAccountIfAuthenticated);

messagesRouter.post('/conversations', requireAuth, async (req, res) => {
  const payload = createConversationSchema.parse(req.body ?? {});
  const userId = req.user!.id;

  if (userId === payload.participantId) {
    return res.status(400).json({ message: 'You cannot create a conversation with yourself.' });
  }

  if (await isBlocked(userId, payload.participantId)) {
    return res.status(403).json({ message: 'You cannot message a user who has blocked you or who you have blocked.' });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const targetUser = await prisma.user.findUnique({ where: { id: payload.participantId }, select: { id: true } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: payload.participantId } } },
        ],
      },
      include: { participants: true },
    });

    if (existing) {
      return res.status(200).json({ conversation: {
        id: existing.id,
        name: existing.name,
        updatedAt: existing.updatedAt,
        lastMessageAt: existing.lastMessageAt,
        lastMessagePreview: existing.lastMessagePreview,
      } });
    }

    const conversation = await prisma.conversation.create({
      data: {
        name: payload.name ?? null,
        ownerId: userId,
        participants: {
          create: [
            { userId, role: 'OWNER' },
            { userId: payload.participantId, role: 'MEMBER' },
          ],
        },
      },
      include: { participants: true },
    });

    return res.status(201).json({ conversation: {
      id: conversation.id,
      name: conversation.name,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
    } });
  }

  const targetUser = socialStore.state.conversationParticipants.some((participant) => participant.userId === payload.participantId);
  if (!targetUser && !socialStore.state.conversationParticipants.some((participant) => participant.userId === payload.participantId)) {
    const userExists = socialStore.state.conversationParticipants.length > 0 || true;
    if (!userExists) {
      return res.status(404).json({ message: 'User not found.' });
    }
  }

  const existing = socialStore.state.conversations.find((conversation) => {
    const participantIds = socialStore.state.conversationParticipants
      .filter((participant) => participant.conversationId === conversation.id)
      .map((participant) => participant.userId);
    return participantIds.includes(userId) && participantIds.includes(payload.participantId);
  });

  if (existing) {
    return res.status(200).json({ conversation: existing });
  }

  const conversation = {
    id: `conversation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: null,
    lastMessagePreview: null,
  };

  socialStore.state.conversations.push(conversation);
  socialStore.state.conversationParticipants.push({
    id: `participant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: conversation.id,
    userId,
    role: 'OWNER',
    joinedAt: new Date().toISOString(),
    lastReadAt: new Date().toISOString(),
    leftAt: null,
  });
  socialStore.state.conversationParticipants.push({
    id: `participant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: conversation.id,
    userId: payload.participantId,
    role: 'MEMBER',
    joinedAt: new Date().toISOString(),
    lastReadAt: null,
    leftAt: null,
  });

  return res.status(201).json({ conversation });
});

messagesRouter.get('/conversations', requireAuth, async (_req, res) => {
  const userId = _req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: { include: { user: { select: { id: true, name: true, email: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ conversations: conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      participants: conversation.participants.map((participant) => ({ id: participant.id, userId: participant.userId, role: participant.role, user: participant.user })),
      lastMessage: conversation.messages[0] ? messageToPublicShape(conversation.messages[0]) : null,
    })) });
  }

  const conversations = socialStore.state.conversations.filter((conversation) => {
    const participants = socialStore.state.conversationParticipants.filter((participant) => participant.conversationId === conversation.id);
    return participants.some((participant) => participant.userId === userId);
  });

  return res.json({ conversations: conversations.map((conversation) => ({
    ...conversation,
    participants: socialStore.state.conversationParticipants.filter((participant) => participant.conversationId === conversation.id).map((participant) => ({
      ...participant,
      user: findUserById(participant.userId) ? { id: participant.userId, name: findUserById(participant.userId)!.name, email: findUserById(participant.userId)!.email } : undefined,
    })),
    lastMessage: socialStore.state.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
  })) });
});

messagesRouter.get('/conversations/:id', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const conversationId = String(req.params.id);

  if (!(await canViewConversation(conversationId, userId))) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    return res.json({ conversation: {
      id: conversation.id,
      name: conversation.name,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      participants: conversation.participants.map((participant) => ({ id: participant.id, userId: participant.userId, role: participant.role, user: participant.user })),
      messages: conversation.messages.filter((message) => !message.deletedAt).map(messageToPublicShape),
    } });
  }

  const conversation = socialStore.state.conversations.find((entry) => entry.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found.' });
  }

  return res.json({
    conversation: {
      ...conversation,
      participants: socialStore.state.conversationParticipants.filter((participant) => participant.conversationId === conversationId),
      messages: socialStore.state.messages
        .filter((message) => message.conversationId === conversationId && !message.deletedAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(messageToPublicShape),
    },
  });
});

messagesRouter.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const conversationId = String(req.params.id);
  const userId = req.user!.id;
  const payload = messageSchema.parse(req.body ?? {});

  if (!(await canViewConversation(conversationId, userId))) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const recipient = await (async () => {
    const dbAvailable = await isDatabaseAvailable();

    if (dbAvailable) {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      return participants.find((participant) => participant.userId !== userId)?.userId ?? null;
    }

    const participants = socialStore.state.conversationParticipants.filter((participant) => participant.conversationId === conversationId);
    return participants.find((participant) => participant.userId !== userId)?.userId ?? null;
  })();

  if (recipient && await isBlocked(userId, recipient)) {
    return res.status(403).json({ message: 'You cannot send messages to a blocked user.' });
  }

  const moderation = reviewContentForSafety({ type: 'message', text: payload.text, userId });
  if (moderation === 'REMOVE') {
    return res.status(400).json({ message: 'This message violates NOVA Community & Safety Rules.' });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const created = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        text: payload.text,
        status: (payload.status ?? 'SENT') as 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: created.createdAt,
        lastMessagePreview: created.text,
        updatedAt: created.updatedAt,
      },
    });

    emitConversationEvent('message:new', conversationId, { message: messageToPublicShape(created), senderId: userId }, [userId, recipient ?? userId].filter(Boolean) as string[]);

    return res.status(201).json({ message: messageToPublicShape(created) });
  }

  const created = {
    id: `message_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    senderId: userId,
    text: payload.text,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readAt: null,
    deletedAt: null,
    status: payload.status ?? 'SENT',
  };

  socialStore.state.messages.push(created);

  const conversation = socialStore.state.conversations.find((entry) => entry.id === conversationId);
  if (conversation) {
    conversation.updatedAt = new Date().toISOString();
    conversation.lastMessageAt = new Date().toISOString();
    conversation.lastMessagePreview = payload.text;
  }

  emitConversationEvent('message:new', conversationId, { message: messageToPublicShape(created), senderId: userId }, [userId, recipient ?? userId].filter(Boolean) as string[]);

  return res.status(201).json({ message: messageToPublicShape(created) });
});

messagesRouter.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  const conversationId = String(req.params.id);
  const userId = req.user!.id;

  if (!(await canViewConversation(conversationId, userId))) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const messages = await prisma.message.findMany({
      where: { conversationId, deletedAt: null, ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json({ messages: messages.reverse().map(messageToPublicShape), hasMore: messages.length === limit });
  }

  const messages = socialStore.state.messages
    .filter((message) => message.conversationId === conversationId && !message.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((message) => !before || new Date(message.createdAt) < before)
    .slice(0, limit)
    .reverse();

  return res.json({ messages: messages.map(messageToPublicShape), hasMore: messages.length === limit });
});

messagesRouter.post('/conversations/:id/read', requireAuth, async (req, res) => {
  const conversationId = String(req.params.id);
  const userId = req.user!.id;
  if (!(await canViewConversation(conversationId, userId))) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const readAt = new Date();
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: readAt },
    });
    const unreadMessages = await prisma.message.findMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      select: { id: true, senderId: true },
    });
    if (unreadMessages.length) {
      await prisma.message.updateMany({ where: { id: { in: unreadMessages.map((message) => message.id) } }, data: { readAt, status: 'READ' } });
      for (const message of unreadMessages) {
        emitConversationEvent('message:read', conversationId, { messageId: message.id, readAt }, [message.senderId]);
      }
    }
  } else {
    const participant = socialStore.state.conversationParticipants.find((entry) => entry.conversationId === conversationId && entry.userId === userId);
    if (participant) participant.lastReadAt = readAt.toISOString();
    socialStore.state.messages.filter((message) => message.conversationId === conversationId && message.senderId !== userId && !message.readAt).forEach((message) => {
      message.readAt = readAt.toISOString();
      message.status = 'READ';
      emitConversationEvent('message:read', conversationId, { messageId: message.id, readAt: message.readAt }, [message.senderId]);
    });
  }
  return res.json({ readAt });
});

messagesRouter.get('/realtime', requireAuth, (req, res) => {
  const userId = req.user!.id;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`event: ready\ndata: ${JSON.stringify({ userId })}\n\n`);
  const unsubscribe = subscribeToUserEvents(userId, (payload) => {
    const event = typeof payload === 'object' && payload !== null && 'event' in payload ? String((payload as { event: string }).event) : 'update';
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); unsubscribe(); });
});

messagesRouter.post('/messages/:id/read', requireAuth, async (req, res) => {
  const messageId = String(req.params.id);
  const userId = req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, senderId: true },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (!(await canViewConversation(message.conversationId, userId))) {
      return res.status(403).json({ message: 'You do not have access to this message.' });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date(), status: 'READ' },
    });

    emitConversationEvent('message:read', message.conversationId, { messageId: updated.id, readAt: updated.readAt }, [userId]);
    return res.json({ message: messageToPublicShape(updated) });
  }

  const message = socialStore.state.messages.find((entry) => entry.id === messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (!(await canViewConversation(message.conversationId, userId))) {
    return res.status(403).json({ message: 'You do not have access to this message.' });
  }

  message.readAt = new Date().toISOString();
  message.status = 'READ';

  emitConversationEvent('message:read', message.conversationId, { messageId: message.id, readAt: message.readAt }, [userId]);
  return res.json({ message: messageToPublicShape(message) });
});

messagesRouter.delete('/messages/:id', requireAuth, async (req, res) => {
  const messageId = String(req.params.id);
  const userId = req.user!.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, conversationId: true, deletedAt: true },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'You cannot delete this message.' });
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), status: 'DELETED', text: '[deleted]' },
    });

    return res.json({ message: messageToPublicShape(deleted) });
  }

  const message = socialStore.state.messages.find((entry) => entry.id === messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (message.senderId !== userId) {
    return res.status(403).json({ message: 'You cannot delete this message.' });
  }

  message.deletedAt = new Date().toISOString();
  message.status = 'DELETED' as 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DELETED';
  message.text = '[deleted]';

  return res.json({ message: messageToPublicShape(message) });
});

export default messagesRouter;
