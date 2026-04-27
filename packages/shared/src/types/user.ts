import { z } from 'zod';

export const UserRole = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const userRoles = Object.values(UserRole) as [string, ...string[]];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
  role: z.enum(userRoles),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(userRoles).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
