import 'dotenv/config';

function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = value !== undefined ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: parseIntEnv(process.env.PORT, 8080),
  birdnetApiUrl: process.env.BIRDNET_API_URL ?? 'http://localhost:8000',
  maxFileSize: parseIntEnv(process.env.MAX_FILE_SIZE, 100 * 1024 * 1024),
  analyzeTimeoutMs: parseIntEnv(process.env.ANALYZE_TIMEOUT_MS, 120_000),
  healthTimeoutMs: parseIntEnv(process.env.HEALTH_TIMEOUT_MS, 15_000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  databasePath: process.env.DATABASE_PATH ?? './data/birdnet.db',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  allowedExtensions: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma', '.aac'] as string[],
};
