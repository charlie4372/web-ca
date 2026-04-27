import { db } from '../config/database.js';
import { caCertificates } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import { encryptPrivateKey, decryptPrivateKey } from '../utils/pem.js';
import { createCaCertificate, parsePemCertificate, validateKeyMatchesCert } from './crypto.service.js';
import type { CaCertificate, KeyAlgorithm } from '@web-ca/shared';

function toResponse(row: typeof caCertificates.$inferSelect): CaCertificate {
  return {
    id: row.id,
    name: row.name,
    serialNumber: row.serialNumber,
    subjectCn: row.subjectCn,
    subjectOrg: row.subjectOrg,
    subjectOu: row.subjectOu,
    subjectCountry: row.subjectCountry,
    keyAlgorithm: row.keyAlgorithm as KeyAlgorithm,
    notBefore: row.notBefore,
    notAfter: row.notAfter,
    certificatePem: row.certificatePem,
    parentCaId: row.parentCaId,
    isUploaded: row.isUploaded,
    fingerprintSha256: row.fingerprintSha256,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listCas(): CaCertificate[] {
  return db.select().from(caCertificates).all().map(toResponse);
}

export function getCaById(id: string): CaCertificate | null {
  const row = db.select().from(caCertificates).where(eq(caCertificates.id, id)).get();
  return row ? toResponse(row) : null;
}

export function getCaWithKey(id: string): { ca: CaCertificate; privateKeyPem: string } | null {
  const row = db.select().from(caCertificates).where(eq(caCertificates.id, id)).get();
  if (!row) return null;
  return { ca: toResponse(row), privateKeyPem: decryptPrivateKey(row.privateKeyPem) };
}

export function createCa(data: {
  name: string;
  subject: { commonName: string; organization: string; organizationalUnit?: string; country?: string };
  keyAlgorithm: KeyAlgorithm;
  validityDays: number;
  parentCaId?: string;
  createdBy: string;
}): CaCertificate {
  let parentCa: { certificate: string; privateKey: string } | undefined;

  if (data.parentCaId) {
    const parent = getCaWithKey(data.parentCaId);
    if (!parent) throw new Error('Parent CA not found');
    parentCa = { certificate: parent.ca.certificatePem, privateKey: parent.privateKeyPem };
  }

  const generated = createCaCertificate({
    subject: data.subject,
    keyAlgorithm: data.keyAlgorithm,
    validityDays: data.validityDays,
    parentCa,
  });

  const row = db.insert(caCertificates).values({
    name: data.name,
    serialNumber: generated.serialNumber,
    subjectCn: data.subject.commonName,
    subjectOrg: data.subject.organization,
    subjectOu: data.subject.organizationalUnit || null,
    subjectCountry: data.subject.country || null,
    keyAlgorithm: data.keyAlgorithm,
    notBefore: generated.notBefore.toISOString(),
    notAfter: generated.notAfter.toISOString(),
    certificatePem: generated.certificatePem,
    privateKeyPem: encryptPrivateKey(generated.privateKeyPem),
    parentCaId: data.parentCaId || null,
    fingerprintSha256: generated.fingerprintSha256,
    createdBy: data.createdBy,
  }).returning().get();

  return toResponse(row);
}

export function uploadCa(data: {
  name: string;
  certificatePem: string;
  privateKeyPem: string;
  createdBy: string;
}): CaCertificate {
  if (!validateKeyMatchesCert(data.certificatePem, data.privateKeyPem)) {
    throw new Error('Private key does not match certificate');
  }

  const parsed = parsePemCertificate(data.certificatePem);
  if (!parsed.isCa) {
    throw new Error('Certificate is not a CA certificate');
  }

  const row = db.insert(caCertificates).values({
    name: data.name,
    serialNumber: parsed.serialNumber,
    subjectCn: parsed.subjectCn,
    subjectOrg: parsed.subjectOrg || 'Unknown',
    subjectOu: parsed.subjectOu,
    subjectCountry: parsed.subjectCountry,
    keyAlgorithm: 'RSA-2048',
    notBefore: parsed.notBefore.toISOString(),
    notAfter: parsed.notAfter.toISOString(),
    certificatePem: data.certificatePem,
    privateKeyPem: encryptPrivateKey(data.privateKeyPem),
    isUploaded: true,
    fingerprintSha256: parsed.fingerprintSha256,
    createdBy: data.createdBy,
  }).returning().get();

  return toResponse(row);
}

export function renewCa(id: string, validityDays: number, createdBy: string): CaCertificate {
  const existing = getCaWithKey(id);
  if (!existing) throw new Error('CA not found');

  const parsed = parsePemCertificate(existing.ca.certificatePem);

  let parentCa: { certificate: string; privateKey: string } | undefined;
  if (existing.ca.parentCaId) {
    const parent = getCaWithKey(existing.ca.parentCaId);
    if (parent) {
      parentCa = { certificate: parent.ca.certificatePem, privateKey: parent.privateKeyPem };
    }
  }

  const generated = createCaCertificate({
    subject: {
      commonName: parsed.subjectCn,
      organization: parsed.subjectOrg || 'Unknown',
      organizationalUnit: parsed.subjectOu || undefined,
      country: parsed.subjectCountry || undefined,
    },
    keyAlgorithm: existing.ca.keyAlgorithm,
    validityDays,
    parentCa,
  });

  const row = db.insert(caCertificates).values({
    name: `${existing.ca.name} (renewed)`,
    serialNumber: generated.serialNumber,
    subjectCn: parsed.subjectCn,
    subjectOrg: parsed.subjectOrg || 'Unknown',
    subjectOu: parsed.subjectOu,
    subjectCountry: parsed.subjectCountry,
    keyAlgorithm: existing.ca.keyAlgorithm,
    notBefore: generated.notBefore.toISOString(),
    notAfter: generated.notAfter.toISOString(),
    certificatePem: generated.certificatePem,
    privateKeyPem: encryptPrivateKey(generated.privateKeyPem),
    parentCaId: id,
    fingerprintSha256: generated.fingerprintSha256,
    createdBy,
  }).returning().get();

  return toResponse(row);
}

export function deleteCa(id: string): boolean {
  const result = db.delete(caCertificates).where(eq(caCertificates.id, id)).run();
  return result.changes > 0;
}
