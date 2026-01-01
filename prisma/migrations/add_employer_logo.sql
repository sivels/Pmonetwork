-- Add logoUrl column to EmployerProfile table
-- Run this SQL directly in Supabase SQL Editor

ALTER TABLE "EmployerProfile" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
