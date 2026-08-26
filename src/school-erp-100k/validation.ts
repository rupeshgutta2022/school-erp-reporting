export type Rule<T> = (value: T) => string | null;
export const required = (label: string): Rule<string> => v => v.trim() ? null : `${label} is required`;
export const email = (label = "Email"): Rule<string> => v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : `${label} is invalid`;
export const phone = (label = "Phone"): Rule<string> => v => !v || /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")) ? null : `${label} is invalid`;
export const minLength = (label: string, n: number): Rule<string> => v => v.length >= n ? null : `${label} must have at least ${n} characters`;
export function validate<T extends Record<string, any>>(values: T, rules: Partial<Record<keyof T, Rule<any>[]>>) {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    for (const rule of rules[key] || []) { const error = rule(values[key]); if (error) { errors[key] = error; break; } }
  }
  return errors;
}
