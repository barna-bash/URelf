import { Router } from 'express';

import URLController from '../controllers/urls';
import { cacheMiddleWare } from '../middlewares/cacheMiddleware';

import loggerMiddleware from '../middlewares/loggerMiddleWare';
import { ensureProtocol } from '../utils/ensureProtocol';

// import type { NewUrlDto } from '../dtos/urls';

const router = Router();
const urlController = new URLController();

// Check if the API key is valid and if the user has not exceeded their rate limit

router.use(cacheMiddleWare);
router.use(loggerMiddleware);

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await urlController.getRedirectUrl(slug);

    res.status(302).redirect(ensureProtocol(result));
  } catch (err) {
    res.status(404).json({ message: err });
  }
});

export default router;
