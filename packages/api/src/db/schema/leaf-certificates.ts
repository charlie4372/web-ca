import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { caCertificates } from './ca-certificates.js';

export const leafCertificates = sqliteTable('leaf_certificates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  serialNumber: text('serial_number').notNull().unique(),
  subjectCn: text('subject_cn').notNull(),
  sanEntries: text('san_entries', { mode: 'json' }).notNull().$type<Array<{ type: string; value: string }>>(),
  keyAlgorithm: text('key_algorithm').notNull(),
  keyUsage: text('key_usage', { mode: 'json' }).notNull().$type<string[]>(),
  extKeyUsage: text('ext_key_usage', { mode: 'json' }).notNull().$type<string[]>(),
  notBefore: text('not_before').notNull(),
  notAfter: text('not_after').notNull(),
  certificatePem: text('certificate_pem').notNull(),
  privateKeyPem: text('private_key_pem').notNull(),
  csrPem: text('csr_pem'),
  issuerCaId: text('issuer_ca_id').notNull().references(() => caCertificates.id),
  renewedFromId: text('renewed_from_id').references((): any => leafCertificates.id),
  fingerprintSha256: text('fingerprint_sha256').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  revokedAt: text('revoked_at'),
});
