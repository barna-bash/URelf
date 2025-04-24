import express from 'express';
import urlRoutes from './routes/url';
import authRoutes from './routes/auth';
import redirectHandler from './routes/redirectHandler';
import { client } from './utils/db';

const app = express();
const port = 3000;

// Global middleware
app.use(express.json()); // For parsing JSON request bodies

// Health check route
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
app.use('/', redirectHandler); // Public
app.use('/urls/', urlRoutes); // Private
app.use('/auth/', authRoutes); // Public

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
