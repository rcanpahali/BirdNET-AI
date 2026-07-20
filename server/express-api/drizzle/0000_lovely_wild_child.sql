CREATE TABLE `analyses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`mimetype` text NOT NULL,
	`file_size` integer NOT NULL,
	`lat` real,
	`lon` real,
	`min_conf` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
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
