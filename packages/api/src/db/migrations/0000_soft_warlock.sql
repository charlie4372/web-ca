CREATE TABLE `ca_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`serial_number` text NOT NULL,
	`subject_cn` text NOT NULL,
	`subject_org` text NOT NULL,
	`subject_ou` text,
	`subject_country` text,
	`key_algorithm` text NOT NULL,
	`not_before` text NOT NULL,
	`not_after` text NOT NULL,
	`certificate_pem` text NOT NULL,
	`private_key_pem` text NOT NULL,
	`parent_ca_id` text,
	`is_uploaded` integer DEFAULT false NOT NULL,
	`fingerprint_sha256` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_ca_id`) REFERENCES `ca_certificates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ca_certificates_serial_number_unique` ON `ca_certificates` (`serial_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `ca_certificates_fingerprint_sha256_unique` ON `ca_certificates` (`fingerprint_sha256`);--> statement-breakpoint
CREATE TABLE `leaf_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`serial_number` text NOT NULL,
	`subject_cn` text NOT NULL,
	`san_entries` text NOT NULL,
	`key_algorithm` text NOT NULL,
	`key_usage` text NOT NULL,
	`ext_key_usage` text NOT NULL,
	`not_before` text NOT NULL,
	`not_after` text NOT NULL,
	`certificate_pem` text NOT NULL,
	`private_key_pem` text NOT NULL,
	`csr_pem` text,
	`issuer_ca_id` text NOT NULL,
	`renewed_from_id` text,
	`fingerprint_sha256` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`issuer_ca_id`) REFERENCES `ca_certificates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`renewed_from_id`) REFERENCES `leaf_certificates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaf_certificates_serial_number_unique` ON `leaf_certificates` (`serial_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `leaf_certificates_fingerprint_sha256_unique` ON `leaf_certificates` (`fingerprint_sha256`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'operator' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);