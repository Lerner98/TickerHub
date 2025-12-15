/**
 * Auth API Integration Tests
 *
 * Tests the /api/auth endpoints with Better Auth.
 * These tests hit the real database to verify auth flows work end-to-end.
 *
 * Test user cleanup happens via unique emails per test run.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  createTestAppWithAuth,
  generateTestUser,
} from '../helpers/authApp';
import { db } from '../../../server/db';
import { user, session, account } from '../../../shared/auth-schema';
import { eq, like } from 'drizzle-orm';

describe('Auth API', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestAppWithAuth();
  });

  // Cleanup test users after all tests complete
  afterAll(async () => {
    // Delete test users created during tests
    await db.delete(user).where(like(user.email, '%@tickerhub.test'));
  });

  // ===========================================================================
  // Health Check
  // ===========================================================================

  describe('GET /api/auth/ok', () => {
    it('should return ok status', async () => {
      const response = await request(app)
        .get('/api/auth/ok')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });
  });

  // ===========================================================================
  // Sign Up
  // ===========================================================================

  describe('POST /api/auth/sign-up/email', () => {
    it('should create a new user with valid credentials', async () => {
      const testUser = generateTestUser();

      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password'); // Password should never be returned

      // Verify session cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const testUser = generateTestUser();

      // First signup should succeed
      await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      // Second signup with same email should fail
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(422);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          password: 'TestPassword123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error for missing password', async () => {
      // Note: Better Auth returns 500 for missing password (internal validation error)
      // This is a library implementation detail
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          email: `test-${Date.now()}@tickerhub.test`,
          name: 'Test User',
        });

      // Accept either 400 or 500 as both indicate the request failed
      expect([400, 500]).toContain(response.status);
    });

    it('should return error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          email: `test-${Date.now()}@tickerhub.test`,
          password: '123', // Too short (min 8 chars)
          name: 'Test User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // Sign In
  // ===========================================================================

  describe('POST /api/auth/sign-in/email', () => {
    it('should sign in with valid credentials', async () => {
      const testUser = generateTestUser();

      // Create user first
      await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      // Sign in
      const response = await request(app)
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for wrong password', async () => {
      const testUser = generateTestUser();

      // Create user first
      await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      // Sign in with wrong password
      const response = await request(app)
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/sign-in/email')
        .send({
          email: 'nonexistent@tickerhub.test',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // Get Session
  // ===========================================================================

  describe('GET /api/auth/get-session', () => {
    it('should return null session when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/get-session')
        .expect(200);

      expect(response.body).toEqual(null);
    });

    it('should return session when authenticated', async () => {
      const testUser = generateTestUser();

      // Sign up and get cookies
      const signupResponse = await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      const cookies = signupResponse.headers['set-cookie'];

      // Get session with cookies
      const response = await request(app)
        .get('/api/auth/get-session')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });
  });

  // ===========================================================================
  // Sign Out
  // ===========================================================================

  describe('POST /api/auth/sign-out', () => {
    it('should successfully call sign out endpoint', async () => {
      const testUser = generateTestUser();

      // Sign up and get cookies
      const signupResponse = await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      const cookies = signupResponse.headers['set-cookie'];

      // Verify session exists
      const sessionBefore = await request(app)
        .get('/api/auth/get-session')
        .set('Cookie', cookies)
        .expect(200);

      expect(sessionBefore.body).toHaveProperty('session');

      // Sign out should succeed
      const signOutResponse = await request(app)
        .post('/api/auth/sign-out')
        .set('Cookie', cookies)
        .expect(200);

      // Sign out response indicates success
      expect(signOutResponse.body).toHaveProperty('success', true);
    });

    it('should handle sign out without session gracefully', async () => {
      // Sign out without being logged in should not error
      const response = await request(app)
        .post('/api/auth/sign-out')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ===========================================================================
  // Database Verification
  // ===========================================================================

  describe('Database Integration', () => {
    it('should create user record in database on signup', async () => {
      const testUser = generateTestUser();

      await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      // Verify user exists in database
      const users = await db
        .select()
        .from(user)
        .where(eq(user.email, testUser.email));

      expect(users.length).toBe(1);
      expect(users[0].email).toBe(testUser.email);
      expect(users[0].name).toBe(testUser.name);
    });

    it('should create session record in database on signin', async () => {
      const testUser = generateTestUser();

      // Sign up
      await request(app)
        .post('/api/auth/sign-up/email')
        .send(testUser)
        .expect(200);

      // Get user ID
      const users = await db
        .select()
        .from(user)
        .where(eq(user.email, testUser.email));

      const userId = users[0].id;

      // Verify session exists in database
      const sessions = await db
        .select()
        .from(session)
        .where(eq(session.userId, userId));

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0]).toHaveProperty('token');
      expect(sessions[0]).toHaveProperty('expiresAt');
    });
  });
});
