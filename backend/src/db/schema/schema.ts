import { pgTable, uuid, text, timestamp, doublePrecision, integer, pgEnum } from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('category', ['ristoranti', 'parchi', 'musei', 'caffè', 'hotel', 'altro']);

export const places = pgTable('places', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: categoryEnum('category').notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  imageUrl: text('image_url').notNull(),
  avgRating: doublePrecision('avg_rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
