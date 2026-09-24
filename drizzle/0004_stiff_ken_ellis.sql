ALTER TABLE `profiles` ADD `reminders_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `reminders_morning` text DEFAULT '08:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `reminders_evening` text DEFAULT '21:00' NOT NULL;