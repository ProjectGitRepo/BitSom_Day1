import { randomUUID } from "node:crypto";
import { employees, lmsCatalog, systemSources } from "../data/index.js";
import { getConnector } from "../connectors/index.js";
import type { SyncLogEntry } from "../types.js";

const syncLogs = new Map<string, SyncLogEntry[]>();
const MAX_LOG_ENTRIES = 15;

export function runSync(connectorId: string): { source: (typeof systemSources)[number]; entry: SyncLogEntry } {
  const connector = getConnector(connectorId);
  const source = systemSources.find((s) => s.id === connectorId);
  if (!connector || !source) {
    throw new Error(`Unknown system source: ${connectorId}`);
  }

  const result = connector.sync({ employees, lmsCatalog });

  source.lastSyncedAt = new Date().toISOString();
  source.recordsSynced += result.recordsChanged;

  const entry: SyncLogEntry = {
    id: randomUUID(),
    connectorId,
    timestamp: source.lastSyncedAt,
    recordsChanged: result.recordsChanged,
    summary: result.summary
  };

  const log = syncLogs.get(connectorId) ?? [];
  log.unshift(entry);
  syncLogs.set(connectorId, log.slice(0, MAX_LOG_ENTRIES));

  return { source, entry };
}

export function getSyncLog(connectorId: string): SyncLogEntry[] {
  return syncLogs.get(connectorId) ?? [];
}
