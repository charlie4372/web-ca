import { z } from 'zod';

export const KeyAlgorithm = {
  RSA_2048: 'RSA-2048',
  RSA_4096: 'RSA-4096',
  EC_P256: 'EC-P256',
  EC_P384: 'EC-P384',
} as const;

export type KeyAlgorithm = (typeof KeyAlgorithm)[keyof typeof KeyAlgorithm];

export const keyAlgorithms = Object.values(KeyAlgorithm) as [string, ...string[]];

export const SanType = {
  DNS: 'dns',
  IP: 'ip',
  URI: 'uri',
  EMAIL: 'email',
} as const;

export type SanType = (typeof SanType)[keyof typeof SanType];

export const sanTypes = Object.values(SanType) as [string, ...string[]];

export interface SanEntry {
  type: SanType;
  value: string;
}

export interface CaCertificate {
  id: string;
  name: string;
  serialNumber: string;
  subjectCn: string;
  subjectOrg: string;
  subjectOu: string | null;
  subjectCountry: string | null;
  keyAlgorithm: KeyAlgorithm;
  notBefore: string;
  notAfter: string;
  certificatePem: string;
  parentCaId: string | null;
  isUploaded: boolean;
  fingerprintSha256: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeafCertificate {
  id: string;
  name: string;
  serialNumber: string;
  subjectCn: string;
  sanEntries: SanEntry[];
  keyAlgorithm: KeyAlgorithm;
  keyUsage: string[];
  extKeyUsage: string[];
  notBefore: string;
  notAfter: string;
  certificatePem: string;
  csrPem: string | null;
  issuerCaId: string;
  renewedFromId: string | null;
  fingerprintSha256: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

const subjectSchema = z.object({
  commonName: z.string().min(1).max(255),
  organization: z.string().min(1).max(255),
  organizationalUnit: z.string().max(255).optional(),
  country: z.string().length(2).optional(),
});

export const createCaSchema = z.object({
  name: z.string().min(1).max(255),
  subject: subjectSchema,
  keyAlgorithm: z.enum(keyAlgorithms),
  validityDays: z.number().int().min(1).max(36500),
  parentCaId: z.string().uuid().optional(),
});

export const uploadCaSchema = z.object({
  name: z.string().min(1).max(255),
  certificatePem: z.string().min(1),
  privateKeyPem: z.string().min(1),
  passphrase: z.string().optional(),
});

export const renewCaSchema = z.object({
  validityDays: z.number().int().min(1).max(36500),
});

const sanEntrySchema = z.object({
  type: z.enum(sanTypes),
  value: z.string().min(1),
});

export const createCertificateSchema = z.object({
  name: z.string().min(1).max(255),
  subjectCn: z.string().min(1).max(255),
  sanEntries: z.array(sanEntrySchema).min(1),
  keyAlgorithm: z.enum(keyAlgorithms),
  validityDays: z.number().int().min(1).max(825),
  keyUsage: z.array(z.string()).optional(),
  extKeyUsage: z.array(z.string()).optional(),
});

export const renewCertificateSchema = z.object({
  validityDays: z.number().int().min(1).max(825),
});
