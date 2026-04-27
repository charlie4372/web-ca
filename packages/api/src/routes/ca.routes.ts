import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { createCaSchema, uploadCaSchema, renewCaSchema } from '@web-ca/shared';
import * as caService from '../services/ca.service.js';

const router = Router();

router.use(requireAuth);

router.get('/', (_req, res) => {
  const cas = caService.listCas();
  res.json({ data: cas });
});

router.get('/:id', (req, res) => {
  const ca = caService.getCaById(req.params.id);
  if (!ca) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'CA not found' } });
    return;
  }
  res.json({ data: ca });
});

router.post('/', validate(createCaSchema), (req, res) => {
  try {
    const ca = caService.createCa({ ...req.body, createdBy: req.session.userId! });
    res.status(201).json({ data: ca });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

router.post('/upload', validate(uploadCaSchema), (req, res) => {
  try {
    const ca = caService.uploadCa({ ...req.body, createdBy: req.session.userId! });
    res.status(201).json({ data: ca });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'UPLOAD_FAILED', message: err.message } });
  }
});

router.post('/:id/renew', validate(renewCaSchema), (req, res) => {
  try {
    const ca = caService.renewCa(req.params.id, req.body.validityDays, req.session.userId!);
    res.status(201).json({ data: ca });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'RENEW_FAILED', message: err.message } });
  }
});

router.delete('/:id', (req, res) => {
  const deleted = caService.deleteCa(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'CA not found' } });
    return;
  }
  res.status(204).end();
});

router.get('/:id/download', (req, res) => {
  const ca = caService.getCaById(req.params.id);
  if (!ca) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'CA not found' } });
    return;
  }
  res.setHeader('Content-Type', 'application/x-pem-file');
  res.setHeader('Content-Disposition', `attachment; filename="${ca.name}.pem"`);
  res.send(ca.certificatePem);
});

export default router;
