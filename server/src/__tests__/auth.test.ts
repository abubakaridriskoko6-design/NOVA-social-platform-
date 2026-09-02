import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { fallbackStore } from '../lib/fallbackStore.js';

describe('auth routes', () => {
  beforeEach(() => {
    fallbackStore.clear();
  });

  it('registers a new user and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nova User',
        email: 'nova@example.com',
        password: 'Password123',
        communityRulesAccepted: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('nova@example.com');
    expect(response.body.token).toBeTypeOf('string');
  });

  it('logs in an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nova User',
        email: 'login@example.com',
        password: 'Password123',
        communityRulesAccepted: true,
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('login@example.com');
    expect(response.body.token).toBeTypeOf('string');
  });

  it('requires community safety rules acceptance during registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nova User',
        email: 'community@example.com',
        password: 'Password123',
        communityRulesAccepted: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Community & Safety Rules');
  });

  it('rejects explicit sexual content in posts', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nova User',
        email: 'safety@example.com',
        password: 'Password123',
        communityRulesAccepted: true,
      });

    const response = await request(app)
      .post('/api/posts')
      .set('Cookie', register.headers['set-cookie'])
      .send({
        content: 'This is explicit sexual content and should be blocked.',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/community.*safety.*rules|violates/i);
  });

  it('returns an error for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password.');
  });
});
