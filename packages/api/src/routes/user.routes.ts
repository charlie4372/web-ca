import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';
import { createUserSchema, updateUserSchema, changePasswordSchema } from '@web-ca/shared';
import * as userService from '../services/user.service.js';

const router = Router();

router.use(requireRole('admin'));

router.get('/', (_req, res) => {
  const users = userService.listUsers();
  res.json({ data: users });
});

router.get('/:id', (req, res) => {
  const user = userService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  res.json({ data: user });
});

router.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' } });
      return;
    }
    res.status(400).json({ error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

router.patch('/:id', validate(updateUserSchema), async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  res.json({ data: user });
});

router.patch('/:id/password', validate(changePasswordSchema), async (req, res) => {
  const success = await userService.changeUserPassword(req.params.id, req.body.password);
  if (!success) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  res.json({ data: { message: 'Password updated' } });
});

router.delete('/:id', (req, res) => {
  if (req.params.id === req.session.userId) {
    res.status(400).json({ error: { code: 'SELF_DELETE', message: 'Cannot delete your own account' } });
    return;
  }
  const deleted = userService.deleteUser(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  res.status(204).end();
});

export default router;
