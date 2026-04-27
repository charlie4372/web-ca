import { db } from '../config/database.js';
import { leafCertificates } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import { encryptPrivateKey, decryptPrivateKey } from '../utils/pem.js';
import { createLeafCertificate } from './crypto.service.js';
import { getCaWithKey } from './ca.service.js';
import type { LeafCertificate, KeyAlgorithm, SanEntry } from '@web-ca/shared';

function toResponse(row: typeof leafCertificates.$inferSelect): LeafCertificate {
  return {
    id: row.id,
    name: row.name,
    serialNumber: row.serialNumber,
    subjectCn: row.subjectCn,
    sanEntries: row.sanEntries as SanEntry[],
    keyAlgorithm: row.keyAlgorithm as KeyAlgorithm,
    keyUsage: row.keyUsage as string[],
    extKeyUsage: row.extKeyUsage as string[],
    notBefore: row.notBefore,
    notAfter: row.notAfter,
    certificatePem: row.certificatePem,
    csrPem: row.csrPem,
    issuerCaId: row.issuerCaId,
    renewedFromId: row.renewedFromId,
    fingerprintSha256: row.fingerprintSha256,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    revokedAt: row.revokedAt,
  };
}

export function listCertificates(caId?: string): LeafCertificate[] {
  if (caId) {
    return db.select().from(leafCertificates).where(eq(leafCertificates.issuerCaId, caId)).all().map(toResponse);
  }
  return db.select().from(leafCertificates).all().map(toResponse);
}

export function getCertificateById(id: string): LeafCertificate | null {
  const row = db.select().from(leafCertificates).where(eq(leafCertificates.id, id)).get();
  return row ? toResponse(row) : null;
}

export function getCertificateWithKey(id: string): { cert: LeafCertificate; privateKeyPem: string } | null {
  const row = db.select().from(leafCertificates).where(eq(leafCertificates.id, id)).get();
  if (!row) return null;
  return { cert: toResponse(row), privateKeyPem: decryptPrivateKey(row.privateKeyPem) };
}

export function createCertificate(data: {
  name: string;
  subjectCn: string;
  sanEntries: SanEntry[];
  keyAlgorithm: KeyAlgorithm;
  validityDays: number;
  keyUsage?: string[];
  extKeyUsage?: string[];
  caId: string;
  createdBy: string;
}): LeafCertificate {
  const ca = getCaWithKey(data.caId);
  if (!ca) throw new Error('CA not found');

  const generated = createLeafCertificate({
    subjectCn: data.subjectCn,
    sanEntries: data.sanEntries,
    keyAlgorithm: data.keyAlgorithm,
    validityDays: data.validityDays,
    keyUsage: data.keyUsage,
    extKeyUsage: data.extKeyUsage,
    caCertificatePem: ca.ca.certificatePem,
    caPrivateKeyPem: ca.privateKeyPem,
  });

  const row = db.insert(leafCertificates).values({
    name: data.name,
    serialNumber: generated.serialNumber,
    subjectCn: data.subjectCn,
    sanEntries: data.sanEntries,
    keyAlgorithm: data.keyAlgorithm,
    keyUsage: data.keyUsage || ['digitalSignature', 'keyEncipherment'],
    extKeyUsage: data.extKeyUsage || ['serverAuth', 'clientAuth'],
    notBefore: generated.notBefore.toISOString(),
    notAfter: generated.notAfter.toISOString(),
    certificatePem: generated.certificatePem,
    privateKeyPem: encryptPrivateKey(generated.privateKeyPem),
    csrPem: generated.csrPem,
    issuerCaId: data.caId,
    fingerprintSha256: generated.fingerprintSha256,
    createdBy: data.createdBy,
  }).returning().get();

  return toResponse(row);
}

export function renewCertificate(id: string, validityDays: number, createdBy: string): LeafCertificate {
  const existing = getCertificateWithKey(id);
  if (!existing) throw new Error('Certificate not found');

  const ca = getCaWithKey(existing.cert.issuerCaId);
  if (!ca) throw new Error('Issuing CA not found');

  const generated = createLeafCertificate({
    subjectCn: existing.cert.subjectCn,
    sanEntries: existing.cert.sanEntries,
    keyAlgorithm: existing.cert.keyAlgorithm,
    validityDays,
    keyUsage: existing.cert.keyUsage,
    extKeyUsage: existing.cert.extKeyUsage,
    caCertificatePem: ca.ca.certificatePem,
    caPrivateKeyPem: ca.privateKeyPem,
  });

  const row = db.insert(leafCertificates).values({
    name: existing.cert.name,
    serialNumber: generated.serialNumber,
    subjectCn: existing.cert.subjectCn,
    sanEntries: existing.cert.sanEntries,
    keyAlgorithm: existing.cert.keyAlgorithm,
    keyUsage: existing.cert.keyUsage,
    extKeyUsage: existing.cert.extKeyUsage,
    notBefore: generated.notBefore.toISOString(),
    notAfter: generated.notAfter.toISOString(),
    certificatePem: generated.certificatePem,
    privateKeyPem: encryptPrivateKey(generated.privateKeyPem),
    csrPem: generated.csrPem,
    issuerCaId: existing.cert.issuerCaId,
    renewedFromId: id,
    fingerprintSha256: generated.fingerprintSha256,
    createdBy,
  }).returning().get();

  return toResponse(row);
}

export function deleteCertificate(id: string): boolean {
  const result = db.delete(leafCertificates).where(eq(leafCertificates.id, id)).run();
  return result.changes > 0;
}
