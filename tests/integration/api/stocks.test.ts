/**
 * Stock API Integration Tests
 *
 * Tests the /api/stocks endpoints with mocked external API responses.
 * Stock service uses file-based mocks in test mode (NODE_ENV=test).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestAppWithoutRateLimiting } from '../helpers/app';
import type { Express } from 'express';

describe('Stock API', () => {
  let app: Express;

  beforeEach(() => {
    // Create fresh app for each test to ensure isolation
    app = createTestAppWithoutRateLimiting();
  });

  describe('GET /api/stocks', () => {
    it('should return top stocks with required fields', async () => {
      const response = await request(app)
        .get('/api/stocks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify stock asset structure
      const stock = response.body[0];
      expect(stock).toHaveProperty('id');
      expect(stock).toHaveProperty('type', 'stock');
      expect(stock).toHaveProperty('symbol');
      expect(stock).toHaveProperty('name');
      expect(stock).toHaveProperty('price');
      expect(typeof stock.price).toBe('number');
    });

    it('should include price change data', async () => {
      const response = await request(app)
        .get('/api/stocks')
        .expect(200);

      const stock = response.body[0];
      expect(stock).toHaveProperty('change24h');
      expect(stock).toHaveProperty('changePercent24h');
      expect(typeof stock.change24h).toBe('number');
      expect(typeof stock.changePercent24h).toBe('number');
    });

    it('should include exchange and currency info', async () => {
      const response = await request(app)
        .get('/api/stocks')
        .expect(200);

      const stock = response.body[0];
      expect(stock).toHaveProperty('exchange');
      expect(stock).toHaveProperty('currency');
    });
  });

  describe('GET /api/stocks/:symbol', () => {
    it('should return stock data for valid symbol', async () => {
      const response = await request(app)
        .get('/api/stocks/AAPL')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('type', 'stock');
      expect(response.body).toHaveProperty('price');
      expect(typeof response.body.price).toBe('number');
    });

    it('should handle lowercase symbols (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/stocks/aapl')
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'AAPL');
    });

    it('should return 404 for invalid symbol', async () => {
      const response = await request(app)
        .get('/api/stocks/INVALID123')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Stock not found');
      expect(response.body).toHaveProperty('symbol', 'INVALID123');
    });
  });

  describe('GET /api/stocks/search', () => {
    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/stocks/search?q=AAPL')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/stocks/search')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing query parameter');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/stocks/search?q=')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing query parameter');
    });
  });

  describe('GET /api/stocks/batch', () => {
    it('should return multiple stocks for valid symbols', async () => {
      const response = await request(app)
        .get('/api/stocks/batch?symbols=AAPL,MSFT')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      const symbols = response.body.map((s: { symbol: string }) => s.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('MSFT');
    });

    it('should handle mixed case symbols', async () => {
      const response = await request(app)
        .get('/api/stocks/batch?symbols=aapl,Msft')
        .expect(200);

      const symbols = response.body.map((s: { symbol: string }) => s.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('MSFT');
    });

    it('should return 400 for missing symbols parameter', async () => {
      const response = await request(app)
        .get('/api/stocks/batch')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing symbols parameter');
    });

    it('should return 400 for too many symbols', async () => {
      const manySymbols = Array(25).fill('AAPL').join(',');

      const response = await request(app)
        .get(`/api/stocks/batch?symbols=${manySymbols}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Too many symbols');
    });

    it('should skip invalid symbols and return valid ones', async () => {
      const response = await request(app)
        .get('/api/stocks/batch?symbols=AAPL,INVALID123,MSFT')
        .expect(200);

      // Should only return valid stocks
      const symbols = response.body.map((s: { symbol: string }) => s.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('MSFT');
      expect(symbols).not.toContain('INVALID123');
    });
  });

  describe('GET /api/stocks/status', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get('/api/stocks/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('service', 'stocks');
      expect(response.body).toHaveProperty('configured');
      expect(response.body).toHaveProperty('mockMode');
      expect(response.body).toHaveProperty('circuitState');
      expect(typeof response.body.configured).toBe('boolean');
      expect(typeof response.body.mockMode).toBe('boolean');
    });

    it('should indicate mock mode in test environment', async () => {
      const response = await request(app)
        .get('/api/stocks/status')
        .expect(200);

      // In test environment, mockMode should be true
      expect(response.body.mockMode).toBe(true);
    });
  });
});
