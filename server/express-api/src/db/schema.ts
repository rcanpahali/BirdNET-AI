import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  targetLocation: text('target_location'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const analyses = sqliteTable('analyses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  fileSize: integer('file_size').notNull(),
  lat: real('lat'),
  lon: real('lon'),
  city: text('city'),
  minConf: real('min_conf'),
  status: text('status', { enum: ['completed', 'failed'] }).notNull(),
  errorMessage: text('error_message'),
  duration: real('duration'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const detections = sqliteTable('detections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  analysisId: integer('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  commonName: text('common_name').notNull(),
  scientificName: text('scientific_name').notNull(),
  confidence: real('confidence').notNull(),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  project: one(projects, {
    fields: [analyses.projectId],
    references: [projects.id],
  }),
  detections: many(detections),
}));

export const detectionsRelations = relations(detections, ({ one }) => ({
  analysis: one(analyses, {
    fields: [detections.analysisId],
    references: [analyses.id],
  }),
}));
