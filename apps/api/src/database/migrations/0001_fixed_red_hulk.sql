ALTER TABLE "match_players" ADD COLUMN "confirmed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "match_players" ADD COLUMN "no_show" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "match_players" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "no_show_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reliability_badge" boolean DEFAULT false NOT NULL;