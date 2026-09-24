CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_email_unique` ON `auth_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `lab_results` ADD `indicators` text;--> statement-breakpoint
ALTER TABLE `profile_locations` ADD `region` text;--> statement-breakpoint
ALTER TABLE `profile_locations` ADD `country_code` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `country_code` text;