CREATE TABLE `monitoring_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`medication_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`next_due` text NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monitoring_user_rule_med_idx` ON `monitoring_completions` (`user_id`,`rule_id`,`medication_id`);