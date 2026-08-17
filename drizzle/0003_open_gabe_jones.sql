CREATE TABLE `government_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricKey` varchar(64) NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`unit` varchar(64),
	`sourceUrl` varchar(2048),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `government_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `government_metrics_metricKey_unique` UNIQUE(`metricKey`)
);
