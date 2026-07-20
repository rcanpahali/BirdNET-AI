import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config';
import * as schema from './schema';

const isInMemory = config.databasePath === ':memory:';
const databaseFilePath = isInMemory ? ':memory:' : path.resolve(config.databasePath);

if (!isInMemory) {
  fs.mkdirSync(path.dirname(databaseFilePath), { recursive: true });
}

const sqlite = new Database(databaseFilePath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: path.resolve(__dirname, '..', '..', 'drizzle') });

export { sqlite };
