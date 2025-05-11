-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS "clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_name" text NOT NULL,
  "contact_first_name" text,
  "contact_last_name" text,
  "email" text,
  "phone" text,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "user_id" integer REFERENCES "public"."users"("id"),
  "company_id" integer REFERENCES "public"."companies"("id"),
  "xero_contact_id" text
);
--> statement-breakpoint

-- Add client_id column to quotes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE "quotes" ADD COLUMN "client_id" integer REFERENCES "public"."clients"("id");
  END IF;
END $$;