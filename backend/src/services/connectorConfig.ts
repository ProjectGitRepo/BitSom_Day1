import { connectorConfigSchemas } from "../data/connectorConfigSchemas.js";
import type { ConnectorConfigField } from "../data/connectorConfigSchemas.js";

interface StoredConfig {
  values: Record<string, string>;
  configuredAt: string;
}

// In-memory only, for the lifetime of the server process — this is credential storage
// for a demo, not a vault. A production build swaps this for a real secrets manager and
// never returns raw values to the client at all, masked or not.
const store = new Map<string, StoredConfig>();

function maskValue(value: string): string {
  if (value.length <= 4) return "•".repeat(value.length);
  return `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}

export function getConfigSchema(connectorId: string): ConnectorConfigField[] | undefined {
  return connectorConfigSchemas[connectorId];
}

export function getConfigStatus(connectorId: string) {
  const schema = connectorConfigSchemas[connectorId];
  if (!schema) return undefined;
  const stored = store.get(connectorId);

  return {
    fields: schema,
    configured: Boolean(stored),
    configuredAt: stored?.configuredAt ?? null,
    maskedValues: schema.map((f) => ({
      key: f.key,
      value: stored?.values[f.key] ? (f.secret ? maskValue(stored.values[f.key]) : stored.values[f.key]) : null
    }))
  };
}

export function saveConfig(connectorId: string, values: Record<string, string>) {
  const schema = connectorConfigSchemas[connectorId];
  if (!schema) throw new Error("Unknown connector");

  const missing = schema.filter((f) => f.required && !values[f.key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required field(s): ${missing.map((f) => f.label).join(", ")}`);
  }

  store.set(connectorId, { values, configuredAt: new Date().toISOString() });
  return getConfigStatus(connectorId);
}
