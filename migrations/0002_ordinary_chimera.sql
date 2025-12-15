CREATE TABLE "watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watchlist_userId_idx" ON "watchlist" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_userId_assetId_idx" ON "watchlist" USING btree ("user_id","asset_id");