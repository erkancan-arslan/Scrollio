-- Add 'admin' value to user_role enum for admin panel access
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
