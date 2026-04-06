-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `phases` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`track_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`week_start` integer NOT NULL,
	`week_end` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`unlock_requires_phase_id` integer,
	FOREIGN KEY (`unlock_requires_phase_id`) REFERENCES `phases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resources_check_1" CHECK(type IN ('book','blog','podcast','website','docs','video'),
	CONSTRAINT "tasks_check_2" CHECK(cadence IN ('daily','weekly','end_of_phase')
);
--> statement-breakpoint
CREATE INDEX `idx_phases_track` ON `phases` (`track_id`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`phase_id` integer NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`type` text NOT NULL,
	`url` text,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resources_check_1" CHECK(type IN ('book','blog','podcast','website','docs','video'),
	CONSTRAINT "tasks_check_2" CHECK(cadence IN ('daily','weekly','end_of_phase')
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`phase_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cadence` text NOT NULL,
	`is_deliverable` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resources_check_1" CHECK(type IN ('book','blog','podcast','website','docs','video'),
	CONSTRAINT "tasks_check_2" CHECK(cadence IN ('daily','weekly','end_of_phase')
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_phase` ON `tasks` (`phase_id`);
*/