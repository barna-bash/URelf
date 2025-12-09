import express from 'express';
import urlRoutes from './routes/url';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import redirectHandler from './routes/redirectHandler';
import { client } from './utils/db';

const app = express();
const port = process.env.PORT || 3000;
const swaggerDocsDisabled = process.env.ENABLE_SWAGGER === 'false';

const registerDocs = async (): Promise<void> => {
  if (swaggerDocsDisabled) {
    return;
  }

  try {
    const [{ default: swaggerUi }, { default: YAML }] = await Promise.all([import('swagger-ui-express'), import('yamljs')]);
    const swaggerDocument = YAML.load(new URL('./openapi.yaml', import.meta.url).pathname);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (error) {
    console.warn('Failed to initialize Swagger UI. Continuing without docs route.', error);
  }
};

await registerDocs();

// Global middlewares
app.use(express.json()); // For parsing JSON request bodies
app.set('trust proxy', true); // Required for getting accurate IP address in the request headers

// Health check route

//TODO: Move to a separate health route/controller files
app.get('/health/server', (_req, res) => {
  res.send('Server is running!');
});

app.get('/health/db', async (_req, res) => {
  try {
    await client.db().command({ ping: 1 });
    res.send('Database is connected!');
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).send('Database connection error');
  }
});

// Mounting routes
app.use('/urls/', urlRoutes); // Private
app.use('/auth/', authRoutes); // Public
app.use('/analytics/', analyticsRoutes); // Private
app.use('/', redirectHandler); // Public

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
