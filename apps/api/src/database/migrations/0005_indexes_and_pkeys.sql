-- Add composite primary key to squad_members
ALTER TABLE "squad_members" ADD PRIMARY KEY ("squad_id", "user_id");

-- Add missing indexes to courts
CREATE INDEX IF NOT EXISTS "idx_courts_city" ON "courts" ("city");
CREATE INDEX IF NOT EXISTS "idx_courts_active" ON "courts" ("active");
CREATE INDEX IF NOT EXISTS "idx_courts_geo" ON "courts" ("lat", "lng");

-- Add missing index to users (soft delete queries)
CREATE INDEX IF NOT EXISTS "idx_users_deleted" ON "users" ("deleted_at");

-- Add missing index to friendships (pending request queries)
CREATE INDEX IF NOT EXISTS "idx_friendships_status" ON "friendships" ("status");
