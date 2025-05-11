ALTER TABLE "quotes" ADD COLUMN "xero_quote_id" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "xero_quote_number" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "xero_quote_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xero_token_set" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xero_tenant_id" text;