import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import argon2 from 'argon2';
import * as schema from './schema/index.js';

const dbPath = process.env.DATABASE_URL || './data/webca.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: resolve(import.meta.dirname, 'migrations') });

const existing = db.select().from(schema.users).get();
if (!existing) {
  const password = await argon2.hash('admin123');
  db.insert(schema.users)
    .values({
      email: 'admin',
      name: 'Admin',
      password,
      role: 'admin',
    })
    .run();
  console.log('Seed complete: admin / admin123');
} else {
  console.log('Database already seeded');
}

sqlite.close();
