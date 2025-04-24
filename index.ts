import express from 'express';
import urlRoutes from './routes/url';
import authRoutes from './routes/auth';

const app = express();
const port = 3000;

// Global middleware
app.use(express.json()); // For parsing JSON request bodies

// Mount your route module under /url
app.use('/urls/', urlRoutes);
app.use('/auth/', authRoutes);

// Health check route
app.get('/health-check', (_req, res) => {
  res.send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
