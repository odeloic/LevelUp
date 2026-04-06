import { relations } from "drizzle-orm/relations";
import { phases, tracks, resources, tasks, completions } from "./schema";

export const phasesRelations = relations(phases, ({one, many}) => ({
	phase: one(phases, {
		fields: [phases.unlockRequiresPhaseId],
		references: [phases.id],
		relationName: "phases_unlockRequiresPhaseId_phases_id"
	}),
	phases: many(phases, {
		relationName: "phases_unlockRequiresPhaseId_phases_id"
	}),
	track: one(tracks, {
		fields: [phases.trackId],
		references: [tracks.id]
	}),
	resources: many(resources),
	tasks: many(tasks),
}));

export const tracksRelations = relations(tracks, ({many}) => ({
	phases: many(phases),
}));

export const resourcesRelations = relations(resources, ({one}) => ({
	phase: one(phases, {
		fields: [resources.phaseId],
		references: [phases.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	phase: one(phases, {
		fields: [tasks.phaseId],
		references: [phases.id]
	}),
	completions: many(completions),
}));

export const completionsRelations = relations(completions, ({one}) => ({
	task: one(tasks, {
		fields: [completions.taskId],
		references: [tasks.id]
	}),
}));