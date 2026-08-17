CREATE TABLE `api_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiName` varchar(64) NOT NULL,
	`status` enum('healthy','degraded','failed') NOT NULL DEFAULT 'healthy',
	`lastSuccessfulFetch` timestamp,
	`lastFailedFetch` timestamp,
	`errorMessage` text,
	`consecutiveFailures` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countdown_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`daysRemaining` int NOT NULL,
	`notificationSent` int NOT NULL DEFAULT 0,
	`notificationSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countdown_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economic_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesId` varchar(64) NOT NULL,
	`seriesName` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`unit` varchar(64),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economic_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`url` varchar(2048) NOT NULL,
	`imageUrl` varchar(2048),
	`source` varchar(255) NOT NULL,
	`author` varchar(255),
	`publishedAt` timestamp,
	`summary` text,
	`summaryGeneratedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_articles_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableMilestoneNotifications` int NOT NULL DEFAULT 1,
	`enableApiFailureNotifications` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteText` text NOT NULL,
	`source` varchar(255),
	`date` varchar(10),
	`externalId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;