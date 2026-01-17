import { runSqlAsync } from "./sqlite";

export type Item = {
  id: number;
  name: string;
  qty: number;
  min_qty: number;
  created_at: string;
  updated_at: string;
  location_id: number | null;
  location_name: string | null;
};

export type Location = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

const REMINDER_TIMES_KEY = "dailyReminderTimes";
const REMINDER_ID_KEY = "dailyReminderId";

type InventoryListener = () => void;

const inventoryListeners = new Set<InventoryListener>();

function notifyInventoryChanged() {
  inventoryListeners.forEach((listener) => listener());
}

export function subscribeInventoryChanges(listener: InventoryListener) {
  inventoryListeners.add(listener);
  return () => {
    inventoryListeners.delete(listener);
  };
}

export async function initDb() {
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      qty INTEGER NOT NULL DEFAULT 0,
      min_qty INTEGER NOT NULL DEFAULT 0,
      location_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
    );
  `);
  await runSqlAsync(
    `CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);`
  );
  const columnsRes = await runSqlAsync(`PRAGMA table_info(items);`);
  const columns = columnsRes.rows._array ?? [];
  const hasLocationId = columns.some((col: { name: string }) => {
    return col.name === "location_id";
  });
  const hasMinQty = columns.some((col: { name: string }) => {
    return col.name === "min_qty";
  });
  if (!hasLocationId) {
    await runSqlAsync(`ALTER TABLE items ADD COLUMN location_id INTEGER;`);
  }
  if (!hasMinQty) {
    await runSqlAsync(
      `ALTER TABLE items ADD COLUMN min_qty INTEGER NOT NULL DEFAULT 0;`
    );
  }
}

export async function loadItems(): Promise<Item[]> {
  const res = await runSqlAsync(
    `
    SELECT
      items.id,
      items.name,
      items.qty,
      items.min_qty,
      items.created_at,
      items.updated_at,
      items.location_id,
      locations.name AS location_name
    FROM items
    LEFT JOIN locations ON items.location_id = locations.id
    ORDER BY items.updated_at DESC;
    `
  );
  return res.rows._array ?? [];
}

export async function loadLocations(): Promise<Location[]> {
  const res = await runSqlAsync(
    `SELECT id, name, created_at, updated_at FROM locations ORDER BY name ASC;`
  );
  return res.rows._array ?? [];
}

export async function addItem(
  name: string,
  locationId: number | null,
  minQty: number
) {
  await runSqlAsync(
    `
    INSERT INTO items (name, qty, min_qty, location_id)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      qty = qty + 1,
      min_qty = excluded.min_qty,
      location_id = excluded.location_id,
      updated_at = datetime('now','localtime');
    `,
    [name, minQty, locationId]
  );
  notifyInventoryChanged();
}

export async function changeItemQty(id: number, delta: number) {
  await runSqlAsync(
    `
    UPDATE items
    SET qty = MAX(qty + ?, 0),
        updated_at = datetime('now','localtime')
    WHERE id = ?;
    `,
    [delta, id]
  );
  notifyInventoryChanged();
}

export async function updateItem(
  id: number,
  name: string,
  minQty: number,
  locationId: number | null
) {
  await runSqlAsync(
    `
    UPDATE items
    SET name = ?,
        min_qty = ?,
        location_id = ?,
        updated_at = datetime('now','localtime')
    WHERE id = ?;
    `,
    [name, minQty, locationId, id]
  );
  notifyInventoryChanged();
}

export async function deleteItem(id: number) {
  await runSqlAsync(`DELETE FROM items WHERE id = ?;`, [id]);
  notifyInventoryChanged();
}

export async function addLocation(name: string) {
  await runSqlAsync(
    `
    INSERT INTO locations (name)
    VALUES (?)
    ON CONFLICT(name) DO UPDATE SET
      updated_at = datetime('now','localtime');
    `,
    [name]
  );
  notifyInventoryChanged();
}

export async function updateLocation(id: number, name: string) {
  await runSqlAsync(
    `
    UPDATE locations
    SET name = ?, updated_at = datetime('now','localtime')
    WHERE id = ?;
    `,
    [name, id]
  );
  notifyInventoryChanged();
}

export async function deleteLocation(id: number) {
  await runSqlAsync(`DELETE FROM locations WHERE id = ?;`, [id]);
  notifyInventoryChanged();
}

export async function countItemsByLocation(id: number): Promise<number> {
  const res = await runSqlAsync(
    `SELECT COUNT(1) AS count FROM items WHERE location_id = ?;`,
    [id]
  );
  return Number(res.rows._array?.[0]?.count ?? 0);
}

export async function getSetting(key: string): Promise<string | null> {
  const res = await runSqlAsync(
    `SELECT value FROM settings WHERE key = ? LIMIT 1;`,
    [key]
  );
  return res.rows._array?.[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await runSqlAsync(
    `
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value;
    `,
    [key, value]
  );
}

export async function getReminderTimes(): Promise<string[]> {
  const raw = await getSetting(REMINDER_TIMES_KEY);
  if (!raw) return ["20:30"];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["20:30"];
  } catch {
    return ["20:30"];
  }
}

export async function setReminderTimes(times: string[]) {
  await setSetting(REMINDER_TIMES_KEY, JSON.stringify(times));
}

export async function getReminderScheduleIds(): Promise<string[]> {
  const raw = await getSetting(REMINDER_ID_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setReminderScheduleIds(ids: string[]) {
  await setSetting(REMINDER_ID_KEY, JSON.stringify(ids));
}
