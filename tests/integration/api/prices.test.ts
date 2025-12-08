/**
 * Crypto Prices API Integration Tests
 *
 * Tests the /api/prices and /api/chart endpoints.
 * Uses MSW to mock CoinGecko API responses.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestAppWithoutRateLimiting } from '../helpers/app';
import type { Express } from 'express';

describe('Crypto Prices API', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestAppWithoutRateLimiting();
  });

  describe('GET /api/prices', () => {
    it('should return cryptocurrency prices', async () => {
      const response = await request(app)
        .get('/api/prices')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should include required price fields', async () => {
      const response = await request(app)
        .get('/api/prices')
        .expect(200);

      const coin = response.body[0];
      expect(coin).toHaveProperty('id');
      expect(coin).toHaveProperty('symbol');
      expect(coin).toHaveProperty('name');
      expect(coin).toHaveProperty('price');
      expect(typeof coin.price).toBe('number');
    });

    it('should include price change data', async () => {
      const response = await request(app)
        .get('/api/prices')
        .expect(200);

      const coin = response.body[0];
      expect(coin).toHaveProperty('priceChangePercentage24h');
      expect(typeof coin.priceChangePercentage24h).toBe('number');
    });

    it('should include market data', async () => {
      const response = await request(app)
        .get('/api/prices')
        .expect(200);

      const coin = response.body[0];
      expect(coin).toHaveProperty('marketCap');
      expect(coin).toHaveProperty('volume24h');
    });
  });

  describe('GET /api/chart/:coinId/:range', () => {
    it('should return chart data for valid coin and range', async () => {
      const response = await request(app)
        .get('/api/chart/bitcoin/1D')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return chart data for 7D range', async () => {
      const response = await request(app)
        .get('/api/chart/ethereum/7D')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return chart data for 30D range', async () => {
      const response = await request(app)
        .get('/api/chart/bitcoin/30D')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include timestamp and price in chart data', async () => {
      const response = await request(app)
        .get('/api/chart/bitcoin/1D')
        .expect(200);

      if (response.body.length > 0) {
        const dataPoint = response.body[0];
        expect(dataPoint).toHaveProperty('timestamp');
        expect(dataPoint).toHaveProperty('price');
        expect(typeof dataPoint.timestamp).toBe('number');
        expect(typeof dataPoint.price).toBe('number');
      }
    });

    it('should return 400 for invalid range', async () => {
      const response = await request(app)
        .get('/api/chart/bitcoin/INVALID')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid coin ID format', async () => {
      // Coin ID should be lowercase alphanumeric with hyphens
      const response = await request(app)
        .get('/api/chart/BITCOIN!/1D')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
