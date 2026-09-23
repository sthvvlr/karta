CREATE TABLE `lab_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`result` text,
	`unit` text,
	`reference_range` text,
	`tested_at` text,
	`file_key` text,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medication_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`medication_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`taken_at` text
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`dosage` text,
	`frequency` text,
	`time_slots` text,
	`meal_relation` text,
	`start_date` text,
	`end_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`city` text NOT NULL,
	`country` text,
	`from_year` integer,
	`to_year` integer,
	`is_current` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`birth_date` text,
	`gender` text,
	`city_current` text,
	`country_current` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vaccinations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vaccine_id` text NOT NULL,
	`date_given` text,
	`dose_number` integer DEFAULT 1 NOT NULL,
	`brand` text,
	`clinic` text,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vaccine_brands` (
	`id` text PRIMARY KEY NOT NULL,
	`vaccine_id` text NOT NULL,
	`name` text NOT NULL,
	`region` text
);
--> statement-breakpoint
CREATE TABLE `vaccine_doses` (
	`id` text PRIMARY KEY NOT NULL,
	`vaccine_id` text NOT NULL,
	`dose_number` integer NOT NULL,
	`after_previous_days` integer
);
--> statement-breakpoint
CREATE TABLE `vaccines` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ru` text NOT NULL,
	`name_en` text NOT NULL,
	`description_ru` text,
	`schedule_ru` text,
	`interval_years` integer,
	`total_doses` integer DEFAULT 1 NOT NULL,
	`audience` text,
	`pregnancy_relevant` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
