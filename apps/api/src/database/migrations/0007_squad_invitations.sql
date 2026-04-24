CREATE TABLE IF NOT EXISTS "squad_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "squad_id" uuid NOT NULL REFERENCES "squads"("id") ON DELETE CASCADE,
  "from_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "to_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_squad_invite" UNIQUE("squad_id", "from_user_id", "to_user_id")
);
CREATE INDEX IF NOT EXISTS "idx_squad_invites_to" ON "squad_invitations" ("to_user_id");
CREATE INDEX IF NOT EXISTS "idx_squad_invites_squad" ON "squad_invitations" ("squad_id");
