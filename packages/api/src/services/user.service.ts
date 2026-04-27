import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import { hashPassword } from './auth.service.js';
import type { User } from '@web-ca/shared';

function toUserResponse(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listUsers(): User[] {
  const rows = db.select().from(users).all();
  return rows.map(toUserResponse);
}

export function getUserById(id: string): User | null {
  const row = db.select().from(users).where(eq(users.id, id)).get();
  return row ? toUserResponse(row) : null;
}

export async function createUser(data: { email: string; name: string; password: string; role: string }): Promise<User> {
  const hashed = await hashPassword(data.password);
  const row = db
    .insert(users)
    .values({ email: data.email, name: data.name, password: hashed, role: data.role as any })
    .returning()
    .get();
  return toUserResponse(row);
}

export async function updateUser(id: string, data: { name?: string; role?: string; isActive?: boolean }): Promise<User | null> {
  const updates: Record<string, any> = { updatedAt: sql`(datetime('now'))` };
  if (data.name !== undefined) updates.name = data.name;
  if (data.role !== undefined) updates.role = data.role;
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  const row = db.update(users).set(updates).where(eq(users.id, id)).returning().get();
  return row ? toUserResponse(row) : null;
}

export async function changeUserPassword(id: string, password: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  const result = db
    .update(users)
    .set({ password: hashed, updatedAt: sql`(datetime('now'))` })
    .where(eq(users.id, id))
    .run();
  return result.changes > 0;
}

export function deleteUser(id: string): boolean {
  const result = db.delete(users).where(eq(users.id, id)).run();
  return result.changes > 0;
}
