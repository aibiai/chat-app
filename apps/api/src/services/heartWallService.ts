import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Heart Wall storage file and helpers shared across routes/services
const HEART_WALL_FILE = join(process.cwd(), 'data', 'confession_heart_wall.json');
// Number of cells reserved for auto-rotation for user-approved images
const HEART_USER_CAP = 44;

export type HeartCell = {
  id: string;
  x: number;
  y: number;
  type: 'square' | 'heart';
  img?: string | null;
  source?: 'admin' | 'user';
};

export type HeartWallData = {
  cells: HeartCell[];
  meta?: { nextUserIndex?: number };
};

export function ensureHeartWallFile() {
  // Align with front-end HEART_PATTERN (9 columns × 8 rows)
  const HEART_PATTERN: number[][] = [
    [0, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0]
  ];

  const needCreate = !existsSync(HEART_WALL_FILE);
  const totalCells = HEART_PATTERN.reduce((a, r) => a + r.filter((x) => x === 1).length, 0);
  if (!needCreate) {
    try {
      const existing = JSON.parse(readFileSync(HEART_WALL_FILE, 'utf-8')) as HeartWallData;
      if (!existing || !Array.isArray(existing.cells) || existing.cells.length !== totalCells) {
        throw new Error('mismatch');
      }
      return; // ok
    } catch {
      // fallthrough to recreate
    }
  }

  // Try to keep old images if any
  let preserved: string[] = [];
  try {
    const prev = JSON.parse(readFileSync(HEART_WALL_FILE, 'utf-8')) as HeartWallData;
    if (prev && Array.isArray(prev.cells)) {
      preserved = prev.cells.map((c) => (typeof c?.img === 'string' ? c.img : '')).filter(Boolean) as string[];
    }
  } catch {}

  const cells: HeartCell[] = [];
  let idCounter = 0;
  for (let y = 0; y < HEART_PATTERN.length; y++) {
    for (let x = 0; x < HEART_PATTERN[y].length; x++) {
      if (HEART_PATTERN[y][x] === 1) {
        const img = preserved[idCounter] || null;
        cells.push({ id: `c${idCounter++}`, x, y, type: 'square', img });
      }
    }
  }
  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(HEART_WALL_FILE, JSON.stringify({ cells, meta: { nextUserIndex: 0 } }, null, 2));
}

export function readHeartWall(): HeartWallData {
  try {
    return JSON.parse(readFileSync(HEART_WALL_FILE, 'utf-8')) as HeartWallData;
  } catch {
    return { cells: [], meta: { nextUserIndex: 0 } };
  }
}

export function saveHeartWall(data: HeartWallData) {
  const existing = readHeartWall();
  const meta = data.meta || existing.meta || { nextUserIndex: 0 };
  writeFileSync(HEART_WALL_FILE, JSON.stringify({ cells: data.cells, meta }, null, 2));
}

// Assign a newly-approved user image into the heart wall rotation area.
export function assignUserHeartImage(url: string) {
  if (!url) return null;
  ensureHeartWallFile();
  const data = readHeartWall();
  const cells = data.cells;
  if (!cells.length) return null;
  const cap = Math.min(HEART_USER_CAP, cells.length);
  const next = (data.meta?.nextUserIndex ?? 0) % cap;
  const cell = cells[next];
  if (cell) {
    cell.img = url;
    cell.source = 'user';
  }
  const newNext = (next + 1) % cap;
  data.meta = { ...(data.meta || {}), nextUserIndex: newNext };
  saveHeartWall(data);
  return { index: next, cellId: cell?.id };
}

// Initialize on module load to ensure file presence
ensureHeartWallFile();
