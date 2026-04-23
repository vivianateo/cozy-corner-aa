import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

type AmenityType = 'seggiolone' | 'menu_bimbi' | 'fasciatoio' | 'luogo_gioco';

const VALID_AMENITIES: Set<AmenityType> = new Set(['seggiolone', 'menu_bimbi', 'fasciatoio', 'luogo_gioco']);

interface CreatePlaceBody {
  name: string;
  category: 'ristoranti' | 'parchi' | 'musei' | 'caffè' | 'hotel' | 'altro';
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  amenities?: string[];
}

interface CreateReviewBody {
  author_name: string;
  rating: number;
  comment: string;
}

interface PlacesQuerystring {
  category?: string;
  search?: string;
  amenities?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/places - List places with optional filters
  fastify.get('/api/places', {
    schema: {
      description: 'List all places with optional filtering',
      tags: ['places'],
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['ristoranti', 'parchi', 'musei', 'caffè', 'hotel', 'altro'],
            description: 'Filter by category',
          },
          search: {
            type: 'string',
            description: 'Search by name, description, or address',
          },
          amenities: {
            type: 'string',
            description: 'Comma-separated list of amenities to filter by (requires all)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            places: {
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
      },
    },
  }, async (request: FastifyRequest<{ Querystring: PlacesQuerystring }>, reply: FastifyReply) => {
    const { category, search, amenities } = request.query;
    app.logger.info({ category, search, amenities }, 'Fetching places');

    try {
      let allPlaces = await app.db.select().from(schema.places);

      if (category) {
        allPlaces = allPlaces.filter((place) => place.category === category);
      }

      let filtered = allPlaces;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = allPlaces.filter(
          (place) =>
            place.name.toLowerCase().includes(searchLower) ||
            place.description.toLowerCase().includes(searchLower) ||
            place.address.toLowerCase().includes(searchLower)
        );
      }

      if (amenities) {
        const requiredAmenities = amenities.split(',').map((a) => a.trim());
        filtered = filtered.filter((place) => {
          const placeAmenities = place.amenities || [];
          return requiredAmenities.every((amenity) => placeAmenities.includes(amenity));
        });
      }

      filtered.sort((a, b) => b.avgRating - a.avgRating);

      const response = {
        places: filtered.map((place) => ({
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

      app.logger.info({ count: response.places.length }, 'Places fetched successfully');
      return response;
    } catch (error) {
      app.logger.error({ err: error, category, search, amenities }, 'Failed to fetch places');
      throw error;
    }
  });

  // GET /api/places/:id - Get place with reviews
  fastify.get('/api/places/:id', {
    schema: {
      description: 'Get a place by ID with all its reviews',
      tags: ['places'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
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
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  place_id: { type: 'string', format: 'uuid' },
                  author_name: { type: 'string' },
                  rating: { type: 'integer' },
                  comment: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
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
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    app.logger.info({ placeId: id }, 'Fetching place details');

    try {
      const place = await app.db.query.places.findFirst({
        where: eq(schema.places.id, id),
      });

      if (!place) {
        app.logger.warn({ placeId: id }, 'Place not found');
        return reply.status(404).send({ error: 'Place not found' });
      }

      const placeReviews = await app.db.select().from(schema.reviews).where(eq(schema.reviews.placeId, id));
      const sortedReviews = placeReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const response = {
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
        reviews: sortedReviews.map((review) => ({
          id: review.id,
          place_id: review.placeId,
          author_name: review.authorName,
          rating: review.rating,
          comment: review.comment,
          created_at: review.createdAt,
        })),
      };

      app.logger.info({ placeId: id, reviewCount: response.reviews.length }, 'Place details fetched successfully');
      return response;
    } catch (error) {
      app.logger.error({ err: error, placeId: id }, 'Failed to fetch place');
      throw error;
    }
  });

  // POST /api/places - Create a new place
  fastify.post('/api/places', {
    schema: {
      description: 'Create a new place',
      tags: ['places'],
      body: {
        type: 'object',
        required: ['name', 'category', 'description', 'address', 'latitude', 'longitude'],
        properties: {
          name: { type: 'string' },
          category: {
            type: 'string',
            enum: ['ristoranti', 'parchi', 'musei', 'caffè', 'hotel', 'altro'],
          },
          description: { type: 'string' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          image_url: { type: 'string' },
          amenities: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['seggiolone', 'menu_bimbi', 'fasciatoio', 'luogo_gioco'],
            },
          },
        },
      },
      response: {
        201: {
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
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: CreatePlaceBody }>, reply: FastifyReply) => {
    const { name, category, description, address, latitude, longitude, image_url, amenities } = request.body;
    const imageUrl = image_url || 'https://picsum.photos/seed/new/800/600';
    const placeAmenities = amenities || [];

    app.logger.info({ name, category, address, amenities }, 'Creating new place');

    try {
      // Validate amenities
      for (const amenity of placeAmenities) {
        if (!VALID_AMENITIES.has(amenity as AmenityType)) {
          app.logger.warn({ amenity, validAmenities: Array.from(VALID_AMENITIES) }, 'Invalid amenity value');
          return reply.status(400).send({ error: `Invalid amenity value: ${amenity}` });
        }
      }

      const [place] = await app.db
        .insert(schema.places)
        .values({
          name,
          category,
          description,
          address,
          latitude,
          longitude,
          imageUrl,
          amenities: placeAmenities,
        })
        .returning();

      app.logger.info({ placeId: place.id, amenities: place.amenities }, 'Place created successfully');
      return reply.status(201).send({
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
      });
    } catch (error) {
      app.logger.error({ err: error, name, category }, 'Failed to create place');
      throw error;
    }
  });

  // POST /api/places/:id/reviews - Create a review
  fastify.post('/api/places/:id/reviews', {
    schema: {
      description: 'Create a review for a place',
      tags: ['places'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['author_name', 'rating', 'comment'],
        properties: {
          author_name: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            place_id: { type: 'string', format: 'uuid' },
            author_name: { type: 'string' },
            rating: { type: 'integer' },
            comment: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: CreateReviewBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { author_name, rating, comment } = request.body;

    app.logger.info({ placeId: id, author: author_name, rating }, 'Creating review');

    try {
      // Verify place exists
      const place = await app.db.query.places.findFirst({
        where: eq(schema.places.id, id),
      });

      if (!place) {
        app.logger.warn({ placeId: id }, 'Place not found');
        return reply.status(404).send({ error: 'Place not found' });
      }

      // Insert review
      const [review] = await app.db
        .insert(schema.reviews)
        .values({
          placeId: id,
          authorName: author_name,
          rating,
          comment,
        })
        .returning();

      // Recalculate avg_rating and review_count
      const allReviews = await app.db
        .select()
        .from(schema.reviews)
        .where(eq(schema.reviews.placeId, id));

      const newReviewCount = allReviews.length;
      const newAvgRating = newReviewCount > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount
        : 0;

      await app.db
        .update(schema.places)
        .set({
          avgRating: newAvgRating,
          reviewCount: newReviewCount,
        })
        .where(eq(schema.places.id, id));

      app.logger.info({ reviewId: review.id, placeId: id, avgRating: newAvgRating }, 'Review created and place updated');
      return reply.status(201).send({
        id: review.id,
        place_id: review.placeId,
        author_name: review.authorName,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt,
      });
    } catch (error) {
      app.logger.error({ err: error, placeId: id, author: author_name }, 'Failed to create review');
      throw error;
    }
  });
}
