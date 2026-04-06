import { sqliteTable, AnySQLiteColumn, check, integer, text, index, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const tracks = sqliteTable("tracks", {
	id: integer().primaryKey({ autoIncrement: true }),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	color: text().default("#6366f1").notNull(),
	icon: text().default("🗺️").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
});

export const phases = sqliteTable("phases", {
	id: integer().primaryKey({ autoIncrement: true }),
	trackId: integer("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" } ),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	weekStart: integer("week_start").notNull(),
	weekEnd: integer("week_end").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	unlockRequiresPhaseId: integer("unlock_requires_phase_id"),
},
(table) => [
	index("idx_phases_track").on(table.trackId),
	foreignKey(() => ({
			columns: [table.unlockRequiresPhaseId],
			foreignColumns: [table.id],
			name: "phases_unlock_requires_phase_id_phases_id_fk"
		})).onDelete("set null"),
]);

export const resources = sqliteTable("resources", {
	id: integer().primaryKey({ autoIncrement: true }),
	phaseId: integer("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" } ),
	title: text().notNull(),
	author: text(),
	type: text().notNull(),
	url: text(),
	description: text(),
	sortOrder: integer("sort_order").default(0).notNull(),
});

export const tasks = sqliteTable("tasks", {
	id: integer().primaryKey({ autoIncrement: true }),
	phaseId: integer("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" } ),
	title: text().notNull(),
	description: text(),
	cadence: text().notNull(),
	isDeliverable: integer("is_deliverable").default(0).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
},
(table) => [
	index("idx_tasks_phase").on(table.phaseId),
]);

export const completions = sqliteTable("completions", {
	id: integer().primaryKey({ autoIncrement: true }),
	taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" } ),
	weekNumber: integer("week_number"),
	dayDate: text("day_date"),
	completedAt: text("completed_at").default(sql`(datetime('now'))`).notNull(),
	prUrl: text("pr_url"),
	notes: text(),
},
(table) => [
	index("idx_completions_task").on(table.taskId),
]);

export const userState = sqliteTable("user_state", {
	id: integer().primaryKey(),
	currentWeek: integer("current_week").default(1).notNull(),
	startedAt: text("started_at").default(sql`(date('now'))`).notNull(),
	streakDays: integer("streak_days").default(0).notNull(),
	lastActiveDate: text("last_active_date"),
	xp: integer().default(0).notNull(),
},
(table) => [
	check("user_state_check_3", sql`id = 1`),
]);

export const xpEvents = sqliteTable("xp_events", {
	id: integer().primaryKey({ autoIncrement: true }),
	eventType: text("event_type").notNull(),
	amount: integer().notNull(),
	taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
	phaseId: integer("phase_id").references(() => phases.id, { onDelete: "set null" }),
	occurredAt: text("occurred_at").default(sql`(datetime('now'))`).notNull(),
},
(table) => [
	index("idx_xp_events_occurred").on(table.occurredAt),
	check("xp_events_event_type_check", sql`event_type IN ('daily','weekly','end_of_phase','deliverable','phase_unlock','streak_7_days')`),
]);
