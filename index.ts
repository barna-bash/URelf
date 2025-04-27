import express from 'express';
import urlRoutes from './routes/url';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import redirectHandler from './routes/redirectHandler';
import { client } from './utils/db';

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./openapi.yaml');

const app = express();
const port = process.env.PORT || 3000;

// Global middlewares
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json()); // For parsing JSON request bodies
app.set('trust proxy', true); // Required for getting accurate IP address in the request headers

// Health check route

//TODO: Move to a separate health route/controller files
app.get('/health/server', (_req, res) => {
  res.send('Server is running!');
});

app.get('/health/db', (_req, res) => {
  client
    .connect()
    .then(() => {
      res.send('Database is connected!');
    })
    .catch((err) => {
      console.error('Database connection error:', err);
      res.status(500).send('Database connection error');
    });
});

// Mounting routes
app.use('/urls/', urlRoutes); // Private
app.use('/auth/', authRoutes); // Public
app.use('/analytics/', analyticsRoutes); // Private
app.use('/', redirectHandler); // Public

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
