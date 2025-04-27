import { Router } from 'express';

import URLController from '../controllers/urls';
import { cacheMiddleWare } from '../middlewares/cacheMiddleware';

import loggerMiddleware from '../middlewares/loggerMiddleWare';
import { ensureProtocol } from '../utils/ensureProtocol';
import { errorHandler } from '../middlewares/errorHandlerMiddleWare';

// import type { NewUrlDto } from '../dtos/urls';

const router = Router();
const urlController = new URLController();

// Check if the API key is valid and if the user has not exceeded their rate limit

router.use(cacheMiddleWare);
router.use(loggerMiddleware);

router.get('/:customAlias', async (req, res) => {
  try {
    const { customAlias } = req.params;
    const result = await urlController.getRedirectUrl(customAlias);

    res.status(302).redirect(ensureProtocol(result));
  } catch (err: unknown) {
    errorHandler(err, req, res);
  }
});

export default router;
