
-- This is a SQL migration script to update the invoice tables for the new Indian format

-- Add new columns to invoices table
ALTER TABLE "public"."invoices"
ADD COLUMN IF NOT EXISTS "advisor_name" text,
ADD COLUMN IF NOT EXISTS "mileage" integer,
ADD COLUMN IF NOT EXISTS "warranty_info" text,
ADD COLUMN IF NOT EXISTS "notes" text;

-- Add new columns to invoice_items table
ALTER TABLE "public"."invoice_items"
ADD COLUMN IF NOT EXISTS "hsn_sac" text,
ADD COLUMN IF NOT EXISTS "cgst_rate" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "sgst_rate" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "igst_rate" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cgst_amount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "sgst_amount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "igst_amount" numeric DEFAULT 0;

-- Create storage bucket for invoice assets if not exists
-- Note: This can't be done via SQL directly, you'll need to create this bucket
-- via the Supabase dashboard or API

-- Run this SQL in the Supabase SQL Editor or via the API to apply the changes
