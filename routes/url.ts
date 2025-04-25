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

// GET all urls created by the user in the context
router.get(
  '/',
  authenticatedRoute(async (_req: AuthenticatedRequest, res) => {
    try {
      const result = await urlController.getUrls(_req.userId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err });
    }
  })
);

// GET url by id - Authorize user to access their own urls
router.get(
  '/:id',
  authenticatedRoute(async (req: AuthenticatedRequest, res) => {
    try {
      const urlId = req.params.id;
      if (!urlId) {
        res.status(400).json({ message: 'URL ID is required' });
        return;
      }
      const result = await urlController.getUrlById(req.userId, { urlId });
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: 'URL not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  })
);

// POST url - Create a new short URL
router.post(
  '/',
  authenticatedRoute(async (req: AuthenticatedRequest & { body: NewUrlDto }, res) => {
    const { originalUrl, slug, description } = req.body;

    const result = await urlController.addUrl(req.userId, { originalUrl, slug, description });
    res.status(201).json(result);
  })
);

// PUT url - Update a short URL
router.put(
  '/:id',
  authenticatedRoute(async (req: AuthenticatedRequest & { body: NewUrlDto }, res) => {
    const { originalUrl, slug, description } = req.body;

    const result = await urlController.addUrl(req.userId, { originalUrl, slug, description });
    res.status(201).json(result);
  })
);
// // GET /url/:shortUrl
// router.get('/:shortUrl', async (req, res) => {
//   try {
//     const result = await urlController.getRedirectUrl(req.params.shortUrl);
//     result ? res.json(result) : res.status(404).json({ message: 'URL not found' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // DELETE /url/:id
// router.delete('/:id', async (req, res) => {
//   const urlId = new ObjectId(req.params.id);
//   const deleted = await urlController.deleteUrl(urlId);
//   deleted ? res.json({ message: 'URL deleted' }) : res.status(404).json({ message: 'Not found' });
// });

export default router;
