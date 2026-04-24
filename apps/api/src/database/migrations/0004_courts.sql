CREATE TABLE IF NOT EXISTS "courts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "address" varchar(500) NOT NULL,
  "city" varchar(100) NOT NULL,
  "lat" real NOT NULL,
  "lng" real NOT NULL,
  "surface" varchar(50) NOT NULL DEFAULT 'sintética',
  "photo_url" text,
  "verified" boolean NOT NULL DEFAULT false,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
