import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable('analyses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  fileSize: integer('file_size').notNull(),
  lat: real('lat'),
  lon: real('lon'),
  minConf: real('min_conf'),
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

export const analysesRelations = relations(analyses, ({ many }) => ({
  detections: many(detections),
}));

export const detectionsRelations = relations(detections, ({ one }) => ({
  analysis: one(analyses, {
    fields: [detections.analysisId],
    references: [analyses.id],
  }),
}));
