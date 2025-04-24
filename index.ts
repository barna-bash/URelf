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
app.get('/health-check', (_req, res) => {
  res.send('Server is running!');
});


// Mounting routes
app.use('/', redirectHandler); // Public
app.use('/urls/', urlRoutes); // Private
app.use('/auth/', authRoutes); // Public

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
