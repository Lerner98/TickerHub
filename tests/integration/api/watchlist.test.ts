/**
 * Watchlist API Integration Tests
 *
 * Tests the /api/watchlist endpoints with authentication.
 * All watchlist routes require authentication.
 */

import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  createTestAppWithAuth,
  generateTestUser,
  signUpAndGetCookies,
} from '../helpers/authApp';
import { db } from '../../../server/db';
import { user, watchlist } from '../../../shared/auth-schema';
import { eq, like, and } from 'drizzle-orm';

describe('Watchlist API', () => {
  let app: Express;
  let authCookies: string[];
  let testUserId: string;
  const testUser = generateTestUser();

  // Setup: Create app and authenticated user before all tests
  beforeAll(async () => {
    app = createTestAppWithAuth();

    // Sign up a test user and get auth cookies
    authCookies = await signUpAndGetCookies(app, testUser);

    // Get user ID for cleanup
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, testUser.email));

    testUserId = users[0].id;
  });

  // Clean up watchlist items between tests to ensure isolation
  beforeEach(async () => {
    if (testUserId) {
      await db.delete(watchlist).where(eq(watchlist.userId, testUserId));
    }
  });

  // Cleanup test users and watchlist items after all tests
  afterAll(async () => {
    // Delete watchlist items first (foreign key constraint)
    await db.delete(watchlist).where(like(watchlist.userId, testUserId));
    // Delete test users
    await db.delete(user).where(like(user.email, '%@tickerhub.test'));
  });

  // ===========================================================================
  // Authentication Required
  // ===========================================================================

  describe('Authentication Required', () => {
    it('GET /api/watchlist should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/watchlist')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('POST /api/watchlist should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .send({ assetId: 'bitcoin', assetType: 'crypto' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('DELETE /api/watchlist/:assetId should return 401 without auth', async () => {
      const response = await request(app)
        .delete('/api/watchlist/bitcoin')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('GET /api/watchlist/check/:assetId should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/watchlist/check/bitcoin')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  // ===========================================================================
  // GET /api/watchlist
  // ===========================================================================

  describe('GET /api/watchlist', () => {
    it('should return empty watchlist for new user', async () => {
      const response = await request(app)
        .get('/api/watchlist')
        .set('Cookie', authCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('count', 0);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBe(0);
    });

    it('should return watchlist items after adding assets', async () => {
      // Add an asset first
      await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'bitcoin', assetType: 'crypto' })
        .expect(201);

      const response = await request(app)
        .get('/api/watchlist')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.items[0]).toHaveProperty('assetId', 'bitcoin');
      expect(response.body.items[0]).toHaveProperty('assetType', 'crypto');
      expect(response.body.items[0]).toHaveProperty('addedAt');
    });
  });

  // ===========================================================================
  // POST /api/watchlist
  // ===========================================================================

  describe('POST /api/watchlist', () => {
    it('should add crypto asset to watchlist', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'bitcoin', assetType: 'crypto' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Asset added to watchlist');
      expect(response.body).toHaveProperty('item');
      expect(response.body.item).toHaveProperty('assetId', 'bitcoin');
      expect(response.body.item).toHaveProperty('assetType', 'crypto');
      expect(response.body.item).toHaveProperty('id');
    });

    it('should add stock asset to watchlist', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'AAPL', assetType: 'stock' })
        .expect(201);

      expect(response.body.item).toHaveProperty('assetId', 'AAPL');
      expect(response.body.item).toHaveProperty('assetType', 'stock');
    });

    it('should return 409 for duplicate asset', async () => {
      // Add asset first
      await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'ethereum', assetType: 'crypto' })
        .expect(201);

      // Try to add same asset again
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'ethereum', assetType: 'crypto' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Conflict');
      expect(response.body).toHaveProperty('message', 'Asset already in watchlist');
    });

    it('should return 400 for missing assetId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetType: 'crypto' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 400 for missing assetType', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'bitcoin' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 400 for invalid assetType', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'something', assetType: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 400 for empty assetId', async () => {
      const response = await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: '', assetType: 'crypto' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });
  });

  // ===========================================================================
  // DELETE /api/watchlist/:assetId
  // ===========================================================================

  describe('DELETE /api/watchlist/:assetId', () => {
    it('should remove asset from watchlist', async () => {
      // Add asset first
      await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'solana', assetType: 'crypto' })
        .expect(201);

      // Delete it
      const response = await request(app)
        .delete('/api/watchlist/solana')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Asset removed from watchlist');
      expect(response.body).toHaveProperty('assetId', 'solana');

      // Verify it's gone
      const listResponse = await request(app)
        .get('/api/watchlist')
        .set('Cookie', authCookies)
        .expect(200);

      expect(listResponse.body.count).toBe(0);
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .delete('/api/watchlist/nonexistent')
        .set('Cookie', authCookies)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message', 'Asset not in watchlist');
    });
  });

  // ===========================================================================
  // GET /api/watchlist/check/:assetId
  // ===========================================================================

  describe('GET /api/watchlist/check/:assetId', () => {
    it('should return false for asset not in watchlist', async () => {
      const response = await request(app)
        .get('/api/watchlist/check/notinlist')
        .set('Cookie', authCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', false);
      expect(response.body).toHaveProperty('assetId', 'notinlist');
    });

    it('should return true for asset in watchlist', async () => {
      // Add asset first
      await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'cardano', assetType: 'crypto' })
        .expect(201);

      const response = await request(app)
        .get('/api/watchlist/check/cardano')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', true);
      expect(response.body).toHaveProperty('assetId', 'cardano');
    });
  });

  // ===========================================================================
  // Database Verification
  // ===========================================================================

  describe('Database Integration', () => {
    it('should persist watchlist item to database', async () => {
      await request(app)
        .post('/api/watchlist')
        .set('Cookie', authCookies)
        .send({ assetId: 'dogecoin', assetType: 'crypto' })
        .expect(201);

      // Verify in database
      const items = await db
        .select()
        .from(watchlist)
        .where(
          and(eq(watchlist.userId, testUserId), eq(watchlist.assetId, 'dogecoin'))
        );

      expect(items.length).toBe(1);
      expect(items[0].assetId).toBe('dogecoin');
      expect(items[0].assetType).toBe('crypto');
      expect(items[0].userId).toBe(testUserId);
    });

    it('should cascade delete watchlist items when user is deleted', async () => {
      // Create a new user specifically for this test
      const tempUser = generateTestUser();
      const tempApp = createTestAppWithAuth();

      const signupRes = await request(tempApp)
        .post('/api/auth/sign-up/email')
        .send(tempUser)
        .expect(200);

      const tempCookies = signupRes.headers['set-cookie'];

      // Get temp user ID
      const tempUsers = await db
        .select()
        .from(user)
        .where(eq(user.email, tempUser.email));

      const tempUserId = tempUsers[0].id;

      // Add watchlist item
      await request(tempApp)
        .post('/api/watchlist')
        .set('Cookie', tempCookies)
        .send({ assetId: 'litecoin', assetType: 'crypto' })
        .expect(201);

      // Verify item exists
      const itemsBefore = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.userId, tempUserId));

      expect(itemsBefore.length).toBe(1);

      // Delete user
      await db.delete(user).where(eq(user.id, tempUserId));

      // Verify watchlist items are cascaded
      const itemsAfter = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.userId, tempUserId));

      expect(itemsAfter.length).toBe(0);
    });
  });

  // ===========================================================================
  // User Isolation
  // ===========================================================================

  describe('User Isolation', () => {
    it('should not show other users watchlist items', async () => {
      // Create first user specifically for this test
      const firstUser = generateTestUser();
      const firstApp = createTestAppWithAuth();
      const firstCookies = await signUpAndGetCookies(firstApp, firstUser);

      // Add item to first user's watchlist
      await request(firstApp)
        .post('/api/watchlist')
        .set('Cookie', firstCookies)
        .send({ assetId: 'polkadot', assetType: 'crypto' })
        .expect(201);

      // Verify first user has the item
      const firstUserList = await request(firstApp)
        .get('/api/watchlist')
        .set('Cookie', firstCookies)
        .expect(200);

      expect(firstUserList.body.count).toBe(1);

      // Create second user
      const secondUser = generateTestUser();
      const secondApp = createTestAppWithAuth();
      const secondCookies = await signUpAndGetCookies(secondApp, secondUser);

      // Second user's watchlist should be empty
      const response = await request(secondApp)
        .get('/api/watchlist')
        .set('Cookie', secondCookies)
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.items.length).toBe(0);

      // Cleanup both users
      await db.delete(user).where(eq(user.email, firstUser.email));
      await db.delete(user).where(eq(user.email, secondUser.email));
    });
  });
});
