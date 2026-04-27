import session from 'express-session';
import { db } from '../config/database.js';
import { sessions } from '../db/schema/index.js';
import { eq, lt } from 'drizzle-orm';

export class SQLiteSessionStore extends session.Store {
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    super();
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  async get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void) {
    try {
      const row = db.select().from(sessions).where(eq(sessions.sid, sid)).get();
      if (!row || row.expiresAt < Date.now()) {
        return callback(null, null);
      }
      callback(null, JSON.parse(row.data));
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const maxAge = sessionData.cookie.maxAge || 8 * 60 * 60 * 1000;
      const expiresAt = Date.now() + maxAge;
      const data = JSON.stringify(sessionData);

      db.insert(sessions)
        .values({ sid, data, expiresAt })
        .onConflictDoUpdate({ target: sessions.sid, set: { data, expiresAt } })
        .run();

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      db.delete(sessions).where(eq(sessions.sid, sid)).run();
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  private cleanup() {
    db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run();
  }

  close() {
    clearInterval(this.cleanupInterval);
  }
}
