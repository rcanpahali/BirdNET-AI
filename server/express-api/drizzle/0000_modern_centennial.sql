CREATE TABLE `analyses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`filename` text NOT NULL,
	`mimetype` text NOT NULL,
	`file_size` integer NOT NULL,
	`lat` real,
	`lon` real,
	`min_conf` real,
	`status` text NOT NULL,
	`error_message` text,
	`duration` real,
	`tags` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `detections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`analysis_id` integer NOT NULL,
	`common_name` text NOT NULL,
	`scientific_name` text NOT NULL,
	`confidence` real NOT NULL,
	`start_time` real NOT NULL,
	`end_time` real NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_location` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
