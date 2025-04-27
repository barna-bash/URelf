import { Router } from 'express';

import { apiKeyAuthMiddleware, type AuthenticatedRequest } from '../middlewares/apiKeyAuthMiddleware';
import URLController from '../controllers/urls';
import { cacheMiddleWare } from '../middlewares/cacheMiddleware';
import { authenticatedRoute } from '../utils/authenticatedRequestHandler';
import type { NewUrlDto, UpdateUrlDto } from '../dtos/url';
import loggerMiddleware from '../middlewares/loggerMiddleWare';
import { errorHandler } from '../middlewares/errorHandlerMiddleWare';

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
    } catch (err: unknown) {
      errorHandler(err, _req, res);
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
      res.json(result);
    } catch (err: unknown) {
      errorHandler(err, req, res);
    }
  })
);

// POST url - Create a new short URL
router.post(
  '/',
  authenticatedRoute(async (req: AuthenticatedRequest & { body: NewUrlDto }, res) => {
    try {
      const { originalUrl, customAlias, description } = req.body;
      const result = await urlController.addUrl(req.userId, { originalUrl, customAlias, description });
      const shortUrl = `${req.protocol}://${req.headers.host}/${result}`;
      res.status(201).json({ shortUrl });
    } catch (err: unknown) {
      errorHandler(err, req, res);
    }
  })
);

// PUT url - Update a short URL
router.put(
  '/:id',
  authenticatedRoute(async (req: AuthenticatedRequest & { body: UpdateUrlDto }, res) => {
    try {
      const result = await urlController.updateUrl(req.userId, { ...req.body });
      res.status(200).json(result);
    } catch (err: unknown) {
      errorHandler(err, req, res);
    }
  })
);

// DELETE url - Delete a short URL
router.delete(
  '/:id',
  authenticatedRoute(async (req: AuthenticatedRequest, res) => {
    try {
      const urlId = req.params.id;
      if (!urlId) {
        res.status(400).json({ message: 'URL ID is required' });
        return;
      }
      const result = await urlController.deleteUrl(req.userId, { urlId });
      res.status(200).json(result);
    } catch (err: unknown) {
      errorHandler(err, req, res);
    }
  })
);

export default router;
