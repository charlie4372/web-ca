import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const caCertificates = sqliteTable('ca_certificates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  serialNumber: text('serial_number').notNull().unique(),
  subjectCn: text('subject_cn').notNull(),
  subjectOrg: text('subject_org').notNull(),
  subjectOu: text('subject_ou'),
  subjectCountry: text('subject_country'),
  keyAlgorithm: text('key_algorithm').notNull(),
  notBefore: text('not_before').notNull(),
  notAfter: text('not_after').notNull(),
  certificatePem: text('certificate_pem').notNull(),
  privateKeyPem: text('private_key_pem').notNull(),
  parentCaId: text('parent_ca_id').references((): any => caCertificates.id),
  isUploaded: integer('is_uploaded', { mode: 'boolean' }).notNull().default(false),
  fingerprintSha256: text('fingerprint_sha256').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});
