import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface AddFavoriteBody {
  place_id: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/favorites/ids - Get favorite place IDs for the user (lightweight endpoint)
  fastify.get('/api/favorites/ids', {
    schema: {
      description: 'Get list of favorite place IDs for the authenticated user',
      tags: ['favorites'],
      response: {
        200: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requireAuth = app.requireAuth();
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching favorite IDs');

    try {
      const favorites = await app.db
        .select({
          placeId: schema.favorites.placeId,
        })
        .from(schema.favorites)
        .where(eq(schema.favorites.userId, userId));

      const ids = favorites.map((fav) => fav.placeId);

      app.logger.info({ userId, count: ids.length }, 'Favorite IDs fetched successfully');
      return { ids };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch favorite IDs');
      throw error;
    }
  });

  // GET /api/favorites - Get all favorited places for the user
  fastify.get('/api/favorites', {
    schema: {
      description: 'Get all favorited places for the authenticated user',
      tags: ['favorites'],
      response: {
        200: {
          type: 'object',
          properties: {
            favorites: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  address: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  image_url: { type: 'string' },
                  avg_rating: { type: 'number' },
                  review_count: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  amenities: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requireAuth = app.requireAuth();
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching favorites');

    try {
      const favoritePlaces = await app.db
        .select({
          id: schema.places.id,
          name: schema.places.name,
          category: schema.places.category,
          description: schema.places.description,
          address: schema.places.address,
          latitude: schema.places.latitude,
          longitude: schema.places.longitude,
          imageUrl: schema.places.imageUrl,
          avgRating: schema.places.avgRating,
          reviewCount: schema.places.reviewCount,
          createdAt: schema.places.createdAt,
          amenities: schema.places.amenities,
        })
        .from(schema.favorites)
        .innerJoin(schema.places, eq(schema.favorites.placeId, schema.places.id))
        .where(eq(schema.favorites.userId, userId));

      const response = {
        favorites: favoritePlaces.map((place) => ({
          id: place.id,
          name: place.name,
          category: place.category,
          description: place.description,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          image_url: place.imageUrl,
          avg_rating: place.avgRating,
          review_count: place.reviewCount,
          created_at: place.createdAt,
          amenities: place.amenities || [],
        })),
      };

      app.logger.info({ userId, count: response.favorites.length }, 'Favorites fetched successfully');
      return response;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch favorites');
      throw error;
    }
  });

  // POST /api/favorites - Add a place to favorites (idempotent)
  fastify.post('/api/favorites', {
    schema: {
      description: 'Add a place to the user\'s favorites',
      tags: ['favorites'],
      body: {
        type: 'object',
        required: ['place_id'],
        properties: {
          place_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: AddFavoriteBody }>, reply: FastifyReply) => {
    const requireAuth = app.requireAuth();
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    const { place_id } = request.body;

    app.logger.info({ userId, placeId: place_id }, 'Adding to favorites');

    try {
      // Check if place exists
      const place = await app.db.query.places.findFirst({
        where: eq(schema.places.id, place_id),
      });

      if (!place) {
        app.logger.warn({ placeId: place_id }, 'Place not found');
        return reply.status(404).send({ error: 'Place not found' });
      }

      // Check if already favorited
      const existing = await app.db.query.favorites.findFirst({
        where: and(eq(schema.favorites.userId, userId), eq(schema.favorites.placeId, place_id)),
      });

      if (existing) {
        app.logger.info({ userId, placeId: place_id }, 'Already favorited, returning 200');
        return { success: true };
      }

      // Insert favorite
      await app.db.insert(schema.favorites).values({
        userId,
        placeId: place_id,
      });

      app.logger.info({ userId, placeId: place_id }, 'Added to favorites successfully');
      return reply.status(201).send({ success: true });
    } catch (error) {
      app.logger.error({ err: error, userId, placeId: place_id }, 'Failed to add to favorites');
      throw error;
    }
  });

  // DELETE /api/favorites/:place_id - Remove a place from favorites
  fastify.delete('/api/favorites/:place_id', {
    schema: {
      description: 'Remove a place from the user\'s favorites',
      tags: ['favorites'],
      params: {
        type: 'object',
        required: ['place_id'],
        properties: {
          place_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { place_id: string } }>, reply: FastifyReply) => {
    const requireAuth = app.requireAuth();
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    const { place_id } = request.params;

    app.logger.info({ userId, placeId: place_id }, 'Removing from favorites');

    try {
      await app.db
        .delete(schema.favorites)
        .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.placeId, place_id)));

      app.logger.info({ userId, placeId: place_id }, 'Removed from favorites successfully');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, userId, placeId: place_id }, 'Failed to remove from favorites');
      throw error;
    }
  });
}
