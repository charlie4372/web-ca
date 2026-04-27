import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authenticateUser } from '../services/auth.service.js';
import { getUserById } from '../services/user.service.js';
import { loginSchema } from '@web-ca/shared';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);

  if (!user) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.json({ data: user });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: { code: 'LOGOUT_FAILED', message: 'Failed to logout' } });
      return;
    }
    res.clearCookie('sid');
    res.json({ data: { message: 'Logged out' } });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.session.userId!);
  if (!user) {
    res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'Session user not found' } });
    return;
  }
  res.json({ data: user });
});

export default router;
