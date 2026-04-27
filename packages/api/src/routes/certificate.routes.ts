import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { createCertificateSchema, renewCertificateSchema } from '@web-ca/shared';
import * as certService from '../services/certificate.service.js';
import * as caService from '../services/ca.service.js';

const router = Router();

router.use(requireAuth);

const createWithCaSchema = createCertificateSchema.extend({ caId: z.string().uuid() });

router.get('/', (req, res) => {
  const caId = req.query.caId as string | undefined;
  const certs = certService.listCertificates(caId);
  res.json({ data: certs });
});

router.get('/:id', (req, res) => {
  const cert = certService.getCertificateById(req.params.id);
  if (!cert) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Certificate not found' } });
    return;
  }
  res.json({ data: cert });
});

router.post('/', validate(createWithCaSchema), (req, res) => {
  try {
    const cert = certService.createCertificate({ ...req.body, createdBy: req.session.userId! });
    res.status(201).json({ data: cert });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

router.post('/:id/renew', validate(renewCertificateSchema), (req, res) => {
  try {
    const cert = certService.renewCertificate(req.params.id, req.body.validityDays, req.session.userId!);
    res.status(201).json({ data: cert });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'RENEW_FAILED', message: err.message } });
  }
});

router.delete('/:id', (req, res) => {
  const deleted = certService.deleteCertificate(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Certificate not found' } });
    return;
  }
  res.status(204).end();
});

router.get('/:id/download', (req, res) => {
  const certWithKey = certService.getCertificateWithKey(req.params.id);
  if (!certWithKey) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Certificate not found' } });
    return;
  }

  const ca = caService.getCaById(certWithKey.cert.issuerCaId);
  const bundle = [
    certWithKey.cert.certificatePem,
    certWithKey.privateKeyPem,
    ca?.certificatePem || '',
  ].filter(Boolean).join('\n');

  res.setHeader('Content-Type', 'application/x-pem-file');
  res.setHeader('Content-Disposition', `attachment; filename="${certWithKey.cert.name}-bundle.pem"`);
  res.send(bundle);
});

export default router;
