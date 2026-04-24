import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { register as registerPlacesRoutes } from './routes/places.js';
import { register as registerFavoritesRoutes } from './routes/favorites.js';

// Combine app and auth schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable Better Auth with email/password and Google OAuth
app.withAuth();

// Register routes
registerPlacesRoutes(app, app.fastify);
registerFavoritesRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running');
