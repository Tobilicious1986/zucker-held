import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ═══════════════════════════════════════════════════════════════
// IndexedDB Schema für Offline-Sync-Queue
// ═══════════════════════════════════════════════════════════════

interface SyncOperation {
  id: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId?: string;
  payload?: unknown;
  createdAt: number;
}

interface ZuckerHeldDB extends DBSchema {
  "sync-queue": {
    key: string;
    value: SyncOperation;
    indexes: { "by-created": number };
  };
}

let db: IDBPDatabase<ZuckerHeldDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ZuckerHeldDB>> {
  if (db) return db;
  db = await openDB<ZuckerHeldDB>("zucker-held-offline", 1, {
    upgrade(database) {
      const store = database.createObjectStore("sync-queue", { keyPath: "id" });
      store.createIndex("by-created", "createdAt");
    },
  });
  return db;
}

export async function enqueueOperation(
  op: Omit<SyncOperation, "id" | "createdAt">
): Promise<void> {
  const database = await getDB();
  await database.add("sync-queue", {
    ...op,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
}

export async function getPendingOperations(): Promise<SyncOperation[]> {
  const database = await getDB();
  return database.getAllFromIndex("sync-queue", "by-created");
}

export async function removeOperation(id: string): Promise<void> {
  const database = await getDB();
  await database.delete("sync-queue", id);
}

export async function getPendingCount(): Promise<number> {
  const database = await getDB();
  return database.count("sync-queue");
}
