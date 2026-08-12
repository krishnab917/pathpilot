import { relations } from "drizzle-orm";
import {
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core identity record managed by the authentication layer. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One persistent career-planning profile per authenticated student. */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  grade: varchar("grade", { length: 16 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  interests: json("interests").$type<string[]>().notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  activities: json("activities").$type<string[]>().notNull(),
  careerPreferences: json("careerPreferences").$type<string[]>().notNull(),
  favoriteSubjects: json("favoriteSubjects").$type<string[]>(),
  personalityTraits: json("personalityTraits").$type<string[]>(),
  careerGoals: json("careerGoals").$type<string[]>(),
  workStyle: varchar("workStyle", { length: 120 }),
  values: json("values").$type<string[]>(),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Reusable career knowledge generated or curated by the platform. */
export const careers = mysqlTable("careers", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  salaryRange: varchar("salaryRange", { length: 120 }).notNull(),
  educationRequirements: text("educationRequirements").notNull(),
  requiredSkills: json("requiredSkills").$type<string[]>().notNull(),
  dailyResponsibilities: json("dailyResponsibilities").$type<string[]>().notNull(),
  relatedCareers: json("relatedCareers").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Exactly five ordered AI recommendations are retained for each discovery analysis. */
export const careerMatches = mysqlTable("career_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  careerId: int("careerId").notNull().references(() => careers.id, { onDelete: "cascade" }),
  rank: int("rank").notNull(),
  matchScore: int("matchScore").notNull(),
  reasoning: text("reasoning").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  missingSkills: json("missingSkills").$type<string[]>().notNull(),
  realityCheck: text("realityCheck").notNull(),
  nextSteps: json("nextSteps").$type<string[]>().notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("career_matches_user_rank_unique").on(table.userId, table.rank),
  index("career_matches_user_generated_idx").on(table.userId, table.generatedAt),
]);

/** Student-owned action items and AI-created planning goals. */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  deadline: timestamp("deadline"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  estimatedHours: int("estimatedHours").default(1).notNull(),
  resources: json("resources").$type<{ label: string; url: string }[]>().notNull(),
  progress: int("progress").default(0).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "paused"]).default("not_started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("goals_user_status_idx").on(table.userId, table.status)]);

/** A career-specific roadmap. Each roadmap is composed of detailed milestones. */
export const roadmaps = mysqlTable("roadmaps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetCareer: varchar("targetCareer", { length: 180 }).notNull(),
  completionPercentage: int("completionPercentage").default(0).notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("roadmaps_user_status_idx").on(table.userId, table.status)]);

/** Annual skills, projects, and experience steps that make a roadmap actionable. */
export const roadmapMilestones = mysqlTable("roadmap_milestones", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  year: int("year").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["skill", "project", "experience"]).notNull(),
  deadline: timestamp("deadline"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  estimatedHours: int("estimatedHours").default(1).notNull(),
  resources: json("resources").$type<{ label: string; url: string }[]>().notNull(),
  progress: int("progress").default(0).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "paused"]).default("not_started").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("roadmap_milestones_roadmap_year_idx").on(table.roadmapId, table.year)]);

/** Persisted interactive simulation, choices, and multi-dimensional fit assessment. */
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  career: varchar("career", { length: 180 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  scenarios: json("scenarios").$type<unknown[]>().notNull(),
  userChoices: json("userChoices").$type<{ scenarioId: string; choiceId: string }[]>().notNull(),
  technicalScore: int("technicalScore").default(0).notNull(),
  leadershipScore: int("leadershipScore").default(0).notNull(),
  careerCompatibilityScore: int("careerCompatibilityScore").default(0).notNull(),
  score: int("score").default(0).notNull(),
  feedback: text("feedback"),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("simulations_user_created_idx").on(table.userId, table.createdAt)]);

/** A durable AI mentor conversation for a student. */
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  context: json("context").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("ai_conversations_user_updated_idx").on(table.userId, table.updatedAt)]);

/** Individual immutable messages that form the persistent mentor history. */
export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("ai_messages_conversation_created_idx").on(table.conversationId, table.createdAt)]);

/** Project Portfolio entries students can use to evidence their progress. */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  githubLink: varchar("githubLink", { length: 500 }),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("projects_user_updated_idx").on(table.userId, table.updatedAt)]);

export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(studentProfiles),
  careerMatches: many(careerMatches),
  goals: many(goals),
  roadmaps: many(roadmaps),
  simulations: many(simulations),
  conversations: many(aiConversations),
  projects: many(projects),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, { fields: [studentProfiles.userId], references: [users.id] }),
}));

export const careersRelations = relations(careers, ({ many }) => ({ careerMatches: many(careerMatches) }));
export const careerMatchesRelations = relations(careerMatches, ({ one }) => ({
  user: one(users, { fields: [careerMatches.userId], references: [users.id] }),
  career: one(careers, { fields: [careerMatches.careerId], references: [careers.id] }),
}));
export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  user: one(users, { fields: [roadmaps.userId], references: [users.id] }),
  milestones: many(roadmapMilestones),
}));
export const roadmapMilestonesRelations = relations(roadmapMilestones, ({ one }) => ({
  roadmap: one(roadmaps, { fields: [roadmapMilestones.roadmapId], references: [roadmaps.id] }),
}));
export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}));
export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] }),
  user: one(users, { fields: [aiMessages.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type Career = typeof careers.$inferSelect;
export type CareerMatch = typeof careerMatches.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Roadmap = typeof roadmaps.$inferSelect;
export type RoadmapMilestone = typeof roadmapMilestones.$inferSelect;
export type Simulation = typeof simulations.$inferSelect;
export type AIConversation = typeof aiConversations.$inferSelect;
export type AIMessage = typeof aiMessages.$inferSelect;
export type Project = typeof projects.$inferSelect;
