/**
 * Kids-specific validation helpers.
 */

import { kidsConfig } from '../constants/config';

/** PIN must be exactly 4 digits */
export const isValidPin = (pin: string): boolean => {
  return new RegExp(`^\\d{${kidsConfig.limits.pinLength}}$`).test(pin);
};

/** Display name between 2-30 characters, trimmed */
export const isValidDisplayName = (name: string): boolean => {
  const trimmed = name.trim();
  return (
    trimmed.length >= kidsConfig.limits.minDisplayNameLength &&
    trimmed.length <= kidsConfig.limits.maxDisplayNameLength
  );
};

/** Basic email validation */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/** Password: min 8 chars, at least one letter and one number */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

/** Password strength: 'weak' | 'medium' | 'strong' */
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 8) return 'weak';
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const score = [hasLetter, hasNumber, hasSpecial, hasUpper, password.length >= 12].filter(
    Boolean,
  ).length;
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
};

/** Date of birth: must be a valid date, child must be between 5-15 years old */
export const isValidDateOfBirth = (dob: string): boolean => {
  const date = new Date(dob);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  return age >= 5 && age <= 15;
};

/** Calculate age from date of birth string */
export const getAge = (dob: string): number => {
  const date = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age--;
  }
  return age;
};
