import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('./data/webca.db'),
  SESSION_SECRET: z.string().min(32).default('dev-session-secret-change-in-production!!'),
  CERT_ENCRYPTION_KEY: z.string().min(32).default('dev-encryption-key-change-in-prod!!!!'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.boolean().default(false),
  SECURE_COOKIES: z.enum(['auto', 'true', 'false']).default('auto'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
