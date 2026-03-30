import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Nest `ConfigService` prefers `process.env` over `.env` file. An **empty** value in the
 * environment (often injected by IDEs) overrides your `.env` file and breaks URLs.
 * This reads the key directly from `.env` on disk when the resolved value is empty.
 */
export function readEnvKeyFromDotenvFile(key: string): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return undefined;
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    const v = parsed[key];
    if (typeof v !== 'string') return undefined;
    const t = v.trim();
    return t || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Prefer ConfigService value; if missing/empty, use raw `.env` file (see above).
 */
export function resolveEnvString(
  fromConfig: string | undefined,
  key: string,
): string | undefined {
  const t = typeof fromConfig === 'string' ? fromConfig.trim() : '';
  if (t) return t;
  return readEnvKeyFromDotenvFile(key);
}
