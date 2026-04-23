import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema/schema.js';
import { register as registerPlacesRoutes } from './routes/places.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Register routes
registerPlacesRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running');
