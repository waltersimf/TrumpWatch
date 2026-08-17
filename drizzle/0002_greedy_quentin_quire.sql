CREATE TABLE `news_link_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsArticleId` int NOT NULL,
	`articleUrl` varchar(2048) NOT NULL,
	`comment` text,
	`reporterUserId` int,
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_link_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `news_link_reports` ADD CONSTRAINT `news_link_reports_newsArticleId_news_articles_id_fk` FOREIGN KEY (`newsArticleId`) REFERENCES `news_articles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `news_link_reports` ADD CONSTRAINT `news_link_reports_reporterUserId_users_id_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;