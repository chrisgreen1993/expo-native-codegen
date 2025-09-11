import type { User } from "./models/user";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  user?: User;
}
