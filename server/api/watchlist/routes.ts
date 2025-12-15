import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import { watchlist } from '../../../shared/auth-schema';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// All watchlist routes require authentication
router.use(requireAuth);

// =============================================================================
// Validation Schemas
// =============================================================================

const addAssetSchema = z.object({
  assetId: z.string().min(1).max(50),
  assetType: z.enum(['crypto', 'stock']),
});

const removeAssetSchema = z.object({
  assetId: z.string().min(1).max(50),
});

// =============================================================================
// GET /api/watchlist - Get user's watchlist
// =============================================================================

router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id;

    const items = await db
      .select({
        id: watchlist.id,
        assetId: watchlist.assetId,
        assetType: watchlist.assetType,
        addedAt: watchlist.addedAt,
      })
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(watchlist.addedAt);

    res.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('[Watchlist] Error fetching watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch watchlist',
    });
  }
});

// =============================================================================
// POST /api/watchlist - Add asset to watchlist
// =============================================================================

router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const parsed = addAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { assetId, assetType } = parsed.data;

    // Check if already in watchlist (unique constraint will also catch this)
    const existing = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.assetId, assetId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Asset already in watchlist',
      });
      return;
    }

    // Insert new watchlist item
    const [item] = await db
      .insert(watchlist)
      .values({
        userId,
        assetId,
        assetType,
      })
      .returning();

    res.status(201).json({
      message: 'Asset added to watchlist',
      item: {
        id: item.id,
        assetId: item.assetId,
        assetType: item.assetType,
        addedAt: item.addedAt,
      },
    });
  } catch (error) {
    console.error('[Watchlist] Error adding to watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add asset to watchlist',
    });
  }
});

// =============================================================================
// DELETE /api/watchlist/:assetId - Remove asset from watchlist
// =============================================================================

router.delete('/:assetId', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;

    if (!assetId || assetId.length > 50) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid asset ID',
      });
      return;
    }

    // Delete the watchlist item
    const result = await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.assetId, assetId)))
      .returning({ id: watchlist.id });

    if (result.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Asset not in watchlist',
      });
      return;
    }

    res.json({
      message: 'Asset removed from watchlist',
      assetId,
    });
  } catch (error) {
    console.error('[Watchlist] Error removing from watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove asset from watchlist',
    });
  }
});

// =============================================================================
// GET /api/watchlist/check/:assetId - Check if asset is in watchlist
// =============================================================================

router.get('/check/:assetId', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;

    if (!assetId || assetId.length > 50) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid asset ID',
      });
      return;
    }

    const existing = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.assetId, assetId)))
      .limit(1);

    res.json({
      inWatchlist: existing.length > 0,
      assetId,
    });
  } catch (error) {
    console.error('[Watchlist] Error checking watchlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check watchlist',
    });
  }
});

export default router;
