import { UserRole } from '../types/user.js';

export const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.OPERATOR]: 'Operator',
};
