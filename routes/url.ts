import { Router } from 'express';

import { apiKeyAuthMiddleware, type AuthenticatedRequest } from '../middlewares/apiKeyAuthMiddleware';

import URLController from '../controllers/urls';
import { cacheMiddleWare } from '../middlewares/cacheMiddleware';
import { authenticatedRoute } from '../utils/authenticatedRequestHandler';

import type { NewUrlDto } from '../dtos/url';
import loggerMiddleware from '../middlewares/loggerMiddleWare';

// import type { NewUrlDto } from '../dtos/urls';

const router = Router();
const urlController = new URLController();

// Check if the API key is valid and if the user has not exceeded their rate limit
router.use(apiKeyAuthMiddleware);

router.use(cacheMiddleWare);
router.use(loggerMiddleware);

router.get(
  '/',
  authenticatedRoute(async (_req: AuthenticatedRequest, res) => {
    try {
      console.log('This is the userId:', _req.userId);
      const result = await urlController.getUrls({ userId: _req.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err });
    }
  })
);

// // GET /url/id/:id
// router.get('/id/:id', async (req: AuthenticatedRequest, res) => {
//   try {
//     const urlId = new ObjectId(req.params.id);
//     const result = await urlController.getUrlById({ userId: req.userId, urlId });
//     result ? res.json(result) : res.status(404).json({ message: 'URL not found' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /url/:shortUrl
// router.get('/:shortUrl', async (req, res) => {
//   try {
//     const result = await urlController.getRedirectUrl(req.params.shortUrl);
//     result ? res.json(result) : res.status(404).json({ message: 'URL not found' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /url
// router.get('/', async (_req, res) => {
//   const result = await urlController.getUrls();
//   res.json(result);
// });

// POST /url
router.post(
  '/',
  authenticatedRoute(async (req: AuthenticatedRequest & { body: NewUrlDto }, res) => {
    const { originalUrl, slug, description } = req.body;
    console.log('posted');
    const result = await urlController.addUrl(req.userId, { originalUrl, slug, description });
    res.status(201).json(result);
  })
);

// // DELETE /url/:id
// router.delete('/:id', async (req, res) => {
//   const urlId = new ObjectId(req.params.id);
//   const deleted = await urlController.deleteUrl(urlId);
//   deleted ? res.json({ message: 'URL deleted' }) : res.status(404).json({ message: 'Not found' });
// });

export default router;
