CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`context` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`careerId` int NOT NULL,
	`rank` int NOT NULL,
	`matchScore` int NOT NULL,
	`reasoning` text NOT NULL,
	`strengths` json NOT NULL,
	`missingSkills` json NOT NULL,
	`realityCheck` text NOT NULL,
	`nextSteps` json NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `career_matches_user_rank_unique` UNIQUE(`userId`,`rank`)
);
--> statement-breakpoint
CREATE TABLE `careers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`salaryRange` varchar(120) NOT NULL,
	`educationRequirements` text NOT NULL,
	`requiredSkills` json NOT NULL,
	`dailyResponsibilities` json NOT NULL,
	`relatedCareers` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careers_id` PRIMARY KEY(`id`),
	CONSTRAINT `careers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`deadline` timestamp,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`estimatedHours` int NOT NULL DEFAULT 1,
	`resources` json NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed','paused') NOT NULL DEFAULT 'not_started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`skills` json NOT NULL,
	`githubLink` varchar(500),
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roadmap_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadmapId` int NOT NULL,
	`year` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`category` enum('skill','project','experience') NOT NULL,
	`deadline` timestamp,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`estimatedHours` int NOT NULL DEFAULT 1,
	`resources` json NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed','paused') NOT NULL DEFAULT 'not_started',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roadmaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetCareer` varchar(180) NOT NULL,
	`completionPercentage` int NOT NULL DEFAULT 0,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`career` varchar(180) NOT NULL,
	`title` varchar(180) NOT NULL,
	`scenarios` json NOT NULL,
	`userChoices` json NOT NULL,
	`technicalScore` int NOT NULL DEFAULT 0,
	`leadershipScore` int NOT NULL DEFAULT 0,
	`careerCompatibilityScore` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`feedback` text,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`grade` varchar(16) NOT NULL,
	`location` varchar(160) NOT NULL,
	`interests` json NOT NULL,
	`skills` json NOT NULL,
	`activities` json NOT NULL,
	`careerPreferences` json NOT NULL,
	`favoriteSubjects` json,
	`personalityTraits` json,
	`careerGoals` json,
	`workStyle` varchar(120),
	`values` json,
	`onboardingCompletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversationId_ai_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_matches` ADD CONSTRAINT `career_matches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_matches` ADD CONSTRAINT `career_matches_careerId_careers_id_fk` FOREIGN KEY (`careerId`) REFERENCES `careers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roadmap_milestones` ADD CONSTRAINT `roadmap_milestones_roadmapId_roadmaps_id_fk` FOREIGN KEY (`roadmapId`) REFERENCES `roadmaps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roadmaps` ADD CONSTRAINT `roadmaps_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulations` ADD CONSTRAINT `simulations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_conversations_user_updated_idx` ON `ai_conversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_created_idx` ON `ai_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `career_matches_user_generated_idx` ON `career_matches` (`userId`,`generatedAt`);--> statement-breakpoint
CREATE INDEX `goals_user_status_idx` ON `goals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `projects_user_updated_idx` ON `projects` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `roadmap_milestones_roadmap_year_idx` ON `roadmap_milestones` (`roadmapId`,`year`);--> statement-breakpoint
CREATE INDEX `roadmaps_user_status_idx` ON `roadmaps` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `simulations_user_created_idx` ON `simulations` (`userId`,`createdAt`);