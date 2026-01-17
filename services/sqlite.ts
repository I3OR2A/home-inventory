import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("inventory.db");
    await dbInstance.execAsync("PRAGMA foreign_keys = ON;");
  }
  return dbInstance;
}

export async function runSqlAsync(
  sql: string,
  params: SQLite.SQLiteBindParams = []
) {
  const db = await getDatabase();
  const normalized = sql.trim().toUpperCase();
  if (normalized.startsWith("SELECT") || normalized.startsWith("PRAGMA")) {
    const rows = await db.getAllAsync(sql, params);
    return { rows: { _array: rows } };
  }
  return db.runAsync(sql, params);
}
