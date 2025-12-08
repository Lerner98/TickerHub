import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Input Validation Middleware
 *
 * Implements OWASP A03:2021 - Injection Prevention
 * Uses Zod for runtime type validation and sanitization.
 *
 * All API parameters are validated against strict schemas to prevent:
 * - SQL Injection (not applicable - no SQL)
 * - NoSQL Injection (not applicable - no database)
 * - Command Injection (parameter sanitization)
 * - Path Traversal (strict format validation)
 *
 * @module server/middleware/validateParams
 * @see https://owasp.org/Top10/A03_2021-Injection/
 */

/**
 * Validation schemas for API parameters
 *
 * Each schema enforces:
 * - Type constraints
 * - Length limits
 * - Format validation via regex
 * - Enumeration for known values
 */
export const schemas = {
  /**
   * Blockchain chain identifier
   * Only 'bitcoin' or 'ethereum' allowed
   */
  chain: z.enum(['bitcoin', 'ethereum'], {
    errorMap: () => ({ message: 'Chain must be "bitcoin" or "ethereum"' }),
  }),

  /**
   * CoinGecko coin identifier
   * Format: lowercase alphanumeric with hyphens
   * Examples: 'bitcoin', 'ethereum', 'binance-coin'
   */
  coinId: z
    .string()
    .min(1, 'Coin ID is required')
    .max(100, 'Coin ID too long')
    .regex(/^[a-z0-9-]+$/, 'Coin ID must be lowercase alphanumeric with hyphens'),

  /**
   * Chart time range
   * Supported values: 1D, 7D, 30D, 90D, 1Y
   */
  timeRange: z.enum(['1D', '7D', '30D', '90D', '1Y'], {
    errorMap: () => ({ message: 'Time range must be 1D, 7D, 30D, 90D, or 1Y' }),
  }),

  /**
   * Block number (as string for URL params)
   * Must be numeric, no leading zeros except for "0"
   */
  blockNumber: z
    .string()
    .regex(/^(0|[1-9]\d*)$/, 'Block number must be a valid non-negative integer'),

  /**
   * Transaction hash
   * Supports both Ethereum (0x prefix) and Bitcoin formats
   * Length: 64 hex characters (+ optional 0x prefix)
   */
  txHash: z
    .string()
    .regex(
      /^(0x)?[a-fA-F0-9]{64}$/,
      'Transaction hash must be 64 hex characters (with optional 0x prefix)'
    ),

  /**
   * Blockchain address
   * Supports:
   * - Ethereum: 0x + 40 hex characters
   * - Bitcoin Legacy: starts with 1 or 3, 25-34 chars
   * - Bitcoin Bech32: starts with bc1, 39-59 chars
   */
  address: z
    .string()
    .min(26, 'Address too short')
    .max(62, 'Address too long')
    .regex(
      /^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
      'Invalid address format. Supported: Ethereum (0x...) or Bitcoin (1.../3.../bc1...)'
    ),

  /**
   * Pagination: items per page
   * Min: 1, Max: 100, Default: 25
   */
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(25),

  /**
   * Pagination: page number
   * Min: 1, Default: 1
   */
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
};

/**
 * Middleware factory for validating request parameters
 *
 * Creates Express middleware that validates request data against a Zod schema.
 * Invalid requests receive a 400 response with detailed error information.
 *
 * @template T - Zod schema type
 * @param schema - Zod schema to validate against
 * @param source - Request property to validate ('params', 'query', or 'body')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Validate URL parameters
 * router.get('/user/:id', validate(z.object({ id: z.string().uuid() })), handler);
 *
 * // Validate query string
 * router.get('/search', validate(z.object({ q: z.string() }), 'query'), handler);
 * ```
 */
export function validate<T extends z.ZodSchema>(
  schema: T,
  source: 'params' | 'query' | 'body' = 'params'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const flatErrors = result.error.flatten();

      res.status(400).json({
        error: 'Validation failed',
        message: 'One or more parameters are invalid',
        details: flatErrors.fieldErrors,
        statusCode: 400,
      });
      return;
    }

    // Replace with validated/transformed data
    // This ensures downstream handlers receive sanitized values
    (req as any)[source] = result.data;
    next();
  };
}

/**
 * Pre-built validators for common route patterns
 *
 * These validators are ready-to-use middleware for standard API endpoints.
 * Each validator includes all necessary field validations.
 *
 * @example
 * ```typescript
 * router.get('/network/:chain', validators.chainParam, handler);
 * router.get('/chart/:coinId/:range', validators.chartParams, handler);
 * ```
 */
export const validators = {
  /**
   * Validates chain parameter (bitcoin | ethereum)
   * Route: /api/network/:chain
   */
  chainParam: validate(
    z.object({
      chain: schemas.chain,
    })
  ),

  /**
   * Validates chart parameters
   * Route: /api/chart/:coinId/:range
   */
  chartParams: validate(
    z.object({
      coinId: schemas.coinId,
      range: schemas.timeRange,
    })
  ),

  /**
   * Validates single block lookup
   * Route: /api/block/:chain/:number
   */
  blockParams: validate(
    z.object({
      chain: schemas.chain,
      number: schemas.blockNumber,
    })
  ),

  /**
   * Validates paginated blocks list
   * Route: /api/blocks/:chain/:limit/:page
   */
  blocksParams: validate(
    z.object({
      chain: schemas.chain,
      limit: schemas.limit,
      page: schemas.page,
    })
  ),

  /**
   * Validates transaction hash lookup
   * Route: /api/tx/:hash
   */
  txParams: validate(
    z.object({
      hash: schemas.txHash,
    })
  ),

  /**
   * Validates address lookup
   * Route: /api/address/:address
   */
  addressParams: validate(
    z.object({
      address: schemas.address,
    })
  ),
};
