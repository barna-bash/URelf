import { Router } from 'express';

import UserController from '../controllers/user';
import NodeCache from 'node-cache';

const router = Router();
const urlController = new UserController();
const ipCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

router.post('/register', async (_req, res) => {
  if (!_req.body || !_req.body.userName || !_req.body.email) {
    res.status(400).json({ message: 'Missing userName or email' });
  }

  const { userName, email } = _req.body;

  // Rate limit based on IP because this endpoint is public
  // TODO: Require IP address in request header?
  const ip = _req.ip || _req.headers['x-forwarded-for']?.toString() || 'no-ip';
  console.log('IP:', ip);

  const apiKey = await urlController.registerUser({ userName, email });

  ipCache.set(ip, apiKey); // Cache the API key for the IP address
  res.status(201).json({ apiKey });
});

export default router;
