import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { fallbackStore } from '../lib/fallbackStore.js';
import { socialStore } from '../lib/socialStore.js';

function getCookieHeader(response: { headers: Record<string, string | string[] | undefined> }) {
  const value = response.headers['set-cookie'];

  if (Array.isArray(value)) {
    return value.join('; ');
  }

  return value ?? '';
}

describe('social platform features', () => {
  beforeEach(() => {
    fallbackStore.clear();
    socialStore.clear();
  });

  it('authenticated user can create a post', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const response = await request(app)
      .post('/api/posts')
      .set('Cookie', getCookieHeader(loginResponse))
      .send({
        content: 'Hello NOVA!',
        imageUrl: 'https://example.com/post.jpg',
      });

    expect(response.status).toBe(201);
    expect(response.body.post.content).toBe('Hello NOVA!');
    expect(response.body.post.author.email).toBe('alice@example.com');
  });

  it('unauthenticated user cannot create a post', async () => {
    const response = await request(app).post('/api/posts').send({ content: 'Nope' });

    expect(response.status).toBe(401);
  });

  it('user can follow another user', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const target = await request(app)
      .post(`/api/users/${(await request(app).get('/api/users')).body.users[1].id}/follow`)
      .set('Cookie', getCookieHeader(aliceLogin));

    expect(target.status).toBe(200);
    expect(target.body.following).toBe(true);
  });

  it('duplicate follow is prevented', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const targetUser = (await request(app).get('/api/users')).body.users.find((user: { email: string }) => user.email === 'bob@example.com');

    const first = await request(app)
      .post(`/api/users/${targetUser.id}/follow`)
      .set('Cookie', getCookieHeader(aliceLogin));

    const second = await request(app)
      .post(`/api/users/${targetUser.id}/follow`)
      .set('Cookie', getCookieHeader(aliceLogin));

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
  });

  it('user can react to a post', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const createdPost = await request(app)
      .post('/api/posts')
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ content: 'Hello world' });

    const response = await request(app)
      .post(`/api/posts/${createdPost.body.post.id}/react`)
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ type: 'LIKE' });

    expect(response.status).toBe(200);
    expect(response.body.reaction.type).toBe('LIKE');
    expect(response.body.reactionCounts.LIKE).toBe(1);
  });

  it('duplicate reaction is prevented or updated', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const createdPost = await request(app)
      .post('/api/posts')
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ content: 'Hello world' });

    await request(app)
      .post(`/api/posts/${createdPost.body.post.id}/react`)
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ type: 'LIKE' });

    const updated = await request(app)
      .post(`/api/posts/${createdPost.body.post.id}/react`)
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ type: 'LOVE' });

    expect(updated.status).toBe(200);
    expect(updated.body.reaction.type).toBe('LOVE');
    expect(updated.body.reactionCounts.LIKE).toBe(0);
    expect(updated.body.reactionCounts.LOVE).toBe(1);
  });

  it('user can comment', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const createdPost = await request(app)
      .post('/api/posts')
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ content: 'The first post' });

    const response = await request(app)
      .post(`/api/posts/${createdPost.body.post.id}/comments`)
      .set('Cookie', getCookieHeader(loginResponse))
      .send({ content: 'Nice post!' });

    expect(response.status).toBe(201);
    expect(response.body.comment.content).toBe('Nice post!');
  });

  it('user cannot delete another user post', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const bobLogin = await request(app).post('/api/auth/login').send({
      email: 'bob@example.com',
      password: 'Password123',
    });

    const createdPost = await request(app)
      .post('/api/posts')
      .set('Cookie', getCookieHeader(aliceLogin))
      .send({ content: 'Alice post' });

    const forbidden = await request(app)
      .delete(`/api/posts/${createdPost.body.post.id}`)
      .set('Cookie', getCookieHeader(bobLogin));

    expect(forbidden.status).toBe(403);
  });

  it('creates a private conversation and sends a message', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123',
      communityRulesAccepted: true,
    });

    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123',
    });

    const bobUser = (await request(app).get('/api/users')).body.users.find((user: { email: string }) => user.email === 'bob@example.com');

    const conversation = await request(app)
      .post('/api/conversations')
      .set('Cookie', getCookieHeader(aliceLogin))
      .send({ participantId: bobUser.id });

    const message = await request(app)
      .post(`/api/conversations/${conversation.body.conversation.id}/messages`)
      .set('Cookie', getCookieHeader(aliceLogin))
      .send({ text: 'Hello Bob, can we coordinate the volunteer plan?' });

    expect(conversation.status).toBe(201);
    expect(message.status).toBe(201);
    expect(message.body.message.text).toContain('volunteer plan');
  });

  it('report requires authentication', async () => {
    const response = await request(app).post('/api/reports').send({
      targetType: 'post',
      targetId: 'missing',
      category: 'SPAM',
      reason: 'This is spam',
    });

    expect(response.status).toBe(401);
  });
});
