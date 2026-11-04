import { boolean, integer, jsonb, pgTable, real, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import type { ExercisePayload, Source } from '../lib/exercises/types'

const id = () => uuid('id').primaryKey().defaultRandom()

export const subjects = pgTable('subjects', {
  id: id(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  emoji: text('emoji').notNull(),
  position: integer('position').notNull(),
}).enableRLS()

export const units = pgTable('units', {
  id: id(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  position: integer('position').notNull(),
}, (t) => [unique().on(t.subjectId, t.number)]).enableRLS()

export const concepts = pgTable('concepts', {
  id: id(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  name: text('name').notNull(),
}).enableRLS()

export const lessons = pgTable('lessons', {
  id: id(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  position: integer('position').notNull(),
  title: text('title').notNull(),
}, (t) => [unique().on(t.unitId, t.position)]).enableRLS()

export const exercises = pgTable('exercises', {
  id: id(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  conceptId: uuid('concept_id').references(() => concepts.id),
  position: integer('position').notNull(),
  kind: text('kind').notNull(),
  payload: jsonb('payload').$type<ExercisePayload>().notNull(),
  source: jsonb('source').$type<Source>(),
  retiredAt: timestamp('retired_at', { withTimezone: true }),
  variantGroup: text('variant_group'),
  reportedAt: timestamp('reported_at', { withTimezone: true }),
}, (t) => [unique().on(t.lessonId, t.position)]).enableRLS()

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey(),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  conceptId: uuid('concept_id'),
  score: real('score').notNull(),
  correct: boolean('correct').notNull(),
  durationMs: integer('duration_ms').notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const lessonCompletions = pgTable('lesson_completions', {
  id: id(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const files = pgTable('files', {
  id: id(),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  name: text('name').notNull(),
  kind: text('kind').notNull(), // 'pdf' | 'imagen'
  pages: integer('pages'),
}, (t) => [unique().on(t.unitId, t.name)]).enableRLS()

export const imports = pgTable('imports', {
  id: id(),
  hash: text('hash').notNull().unique(),
  file: text('file').notNull(),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()
