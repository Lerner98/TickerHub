/**
 * Health Check API Integration Tests
 *
 * Tests the /api/health and /api/stats endpoints.
 * Uses MSW to mock external service health checks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestAppWithoutRateLimiting } from '../helpers/app';
import type { Express } from 'express';

describe('Health & Stats API', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestAppWithoutRateLimiting();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      // May return 200 (all healthy) or 503 (degraded)
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty('status');
      expect(['ok', 'degraded']).toContain(response.body.status);
    });

    it('should include timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('timestamp');
      // Should be valid ISO date
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include uptime', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include response time', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('responseTime');
      expect(typeof response.body.responseTime).toBe('number');
    });

    it('should include services status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('coingecko');
      expect(response.body.services).toHaveProperty('etherscan');
      expect(response.body.services).toHaveProperty('blockchain');
    });

    it('should include cache stats', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('cache');
      expect(response.body.cache).toHaveProperty('size');
    });

    it('should include environment', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).toHaveProperty('environment');
    });

    it('should report service status with responseTime or error', async () => {
      const response = await request(app)
        .get('/api/health');

      const services = response.body.services;

      for (const [_name, service] of Object.entries(services)) {
        const svc = service as { status: string; responseTime?: number; error?: string };
        expect(svc).toHaveProperty('status');
        expect(['ok', 'error']).toContain(svc.status);

        if (svc.status === 'ok') {
          expect(svc).toHaveProperty('responseTime');
          expect(typeof svc.responseTime).toBe('number');
        }
      }
    });
  });

  describe('GET /api/stats', () => {
    it('should return platform statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalBlocks');
      expect(response.body).toHaveProperty('totalTransactions');
      expect(response.body).toHaveProperty('networksSupported');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return numeric values for block/transaction counts', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(typeof response.body.totalBlocks).toBe('number');
      expect(typeof response.body.totalTransactions).toBe('number');
      expect(typeof response.body.networksSupported).toBe('number');
    });

    it('should be cacheable (same response on rapid requests)', async () => {
      const response1 = await request(app)
        .get('/api/stats')
        .expect(200);

      const response2 = await request(app)
        .get('/api/stats')
        .expect(200);

      // Stats should be identical (from cache)
      expect(response1.body).toEqual(response2.body);
    });
  });
});
