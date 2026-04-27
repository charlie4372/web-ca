import argon2 from 'argon2';
import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function authenticateUser(email: string, password: string) {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !user.isActive) return null;

  const valid = await verifyPassword(user.password, password);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
