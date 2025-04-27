//Route for analytics

import { Router } from 'express';
import { apiKeyAuthMiddleware, type AuthenticatedRequest } from '../middlewares/apiKeyAuthMiddleware';
import loggerMiddleware from '../middlewares/loggerMiddleWare';
import { authenticatedRoute } from '../utils/authenticatedRequestHandler';
import URLController from '../controllers/urls';
import { errorHandler } from '../middlewares/errorHandlerMiddleWare';

const urlController = new URLController();

const router = Router();

router.use(apiKeyAuthMiddleware);
// Disabled caching for analytics as it can frequently change
// router.use(cacheMiddleWare);
router.use(loggerMiddleware);

router.get(
  '/:alias',
  authenticatedRoute(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      const alias = req.params?.alias;
      if (!alias) {
        res.status(400).json({ message: 'Alias is required' });
        return;
      }
      const result = await urlController.getUrlAnalytics(userId, { alias });
      res.json(result);
    } catch (err: unknown) {
      errorHandler(err, req, res);
    }
  })
);

export default router;
