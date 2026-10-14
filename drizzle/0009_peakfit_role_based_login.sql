ALTER TABLE "admin_profiles" ADD COLUMN "email" varchar(254);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_email_uq" ON "admin_profiles" USING btree ("email");
--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"email" varchar(254) PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" "admin_role" NOT NULL,
	"invited_by_admin_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_admin_id_admin_profiles_auth_user_id_fk" FOREIGN KEY ("invited_by_admin_id") REFERENCES "public"."admin_profiles"("auth_user_id") ON DELETE restrict ON UPDATE no action;
