import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  FolderKanban,
  MessageSquareQuote,
  GraduationCap,
  Tags,
  RefreshCw,
  CheckCircle2,
  History,
  Sparkles,
  KeyRound,
  AlertCircle
} from "lucide-react";
import { api } from "../lib/api";
import type { ConnectorConfigStatus, SyncLogEntry, SystemSource } from "../types";
import PageHeader from "../components/PageHeader";

const iconByCategory: Record<string, typeof Users> = {
  "Employee Profiles & Org Data": Users,
  "Resumes & Certifications": FileText,
  "Project Records": FolderKanban,
  "Manager Feedback": MessageSquareQuote,
  "Learning & Development": GraduationCap,
  "Skills Mapping Engine": Tags
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function SystemConfig() {
  const [tab, setTab] = useState<"systems" | "profile">("systems");
  const [sources, setSources] = useState<SystemSource[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, SyncLogEntry[]>>({});
  const [loadingLog, setLoadingLog] = useState<string | null>(null);
  const [configExpandedId, setConfigExpandedId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, ConnectorConfigStatus>>({});
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [savingConfigId, setSavingConfigId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<Record<string, string>>({});

  useEffect(() => {
    api.listSystemSources().then((r) => {
      setSources(r.sources);
      r.sources.forEach((s) => {
        api.getConnectorConfig(s.id).then(({ config }) => setConfigs((prev) => ({ ...prev, [s.id]: config })));
      });
    });
  }, []);

  const toggleConfig = (id: string) => {
    setConfigExpandedId((cur) => (cur === id ? null : id));
    if (!drafts[id]) {
      const current = configs[id];
      const seed: Record<string, string> = {};
      current?.fields.forEach((f) => {
        const masked = current.maskedValues.find((m) => m.key === f.key)?.value;
        if (masked && !f.secret) seed[f.key] = masked;
      });
      setDrafts((prev) => ({ ...prev, [id]: seed }));
    }
  };

  const handleSaveConfig = async (id: string) => {
    setSavingConfigId(id);
    setConfigError((prev) => ({ ...prev, [id]: "" }));
    try {
      const { config } = await api.saveConnectorConfig(id, drafts[id] ?? {});
      setConfigs((prev) => ({ ...prev, [id]: config }));
    } catch (e) {
      setConfigError((prev) => ({ ...prev, [id]: (e as Error).message }));
    } finally {
      setSavingConfigId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const { source, entry } = await api.syncSystemSource(id);
      setSources((prev) => prev.map((s) => (s.id === id ? source : s)));
      setLastMessage((prev) => ({ ...prev, [id]: entry.summary }));
      if (expandedId === id) {
        const { log } = await api.getSyncLog(id);
        setLogs((prev) => ({ ...prev, [id]: log }));
      }
    } finally {
      setSyncingId(null);
    }
  };

  const toggleHistory = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!logs[id]) {
      setLoadingLog(id);
      try {
        const { log } = await api.getSyncLog(id);
        setLogs((prev) => ({ ...prev, [id]: log }));
      } finally {
        setLoadingLog(null);
      }
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Settings & system config"
        description="Manage the source systems TalentIQ aggregates from — this is what makes the fragmented picture in Talent 360 possible."
      />

      <div className="border-b border-stone-200 bg-white px-8">
        <div className="flex gap-6">
          {(["systems", "profile"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {t === "systems" ? "Connected systems" : "Profile & preferences"}
            </button>
          ))}
        </div>
      </div>

      {tab === "systems" && (
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sources.map((s) => {
              const Icon = iconByCategory[s.category] ?? Users;
              const isSyncing = syncingId === s.id;
              return (
                <div key={s.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{s.name}</p>
                        <p className="text-xs text-stone-400">{s.category}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 size={12} /> Connected
                      </span>
                      {configs[s.id] && !configs[s.id].configured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <AlertCircle size={10} /> Needs credentials
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-stone-500">{s.description}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                    <div className="text-xs text-stone-400">
                      <p><strong className="text-stone-600">{s.recordsSynced}</strong> records synced</p>
                      <p>{s.syncFrequency} · last synced {relativeTime(s.lastSyncedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleConfig(s.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                          configExpandedId === s.id ? "border-brand-200 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <KeyRound size={13} /> Configure
                      </button>
                      <button
                        onClick={() => toggleHistory(s.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                          expandedId === s.id ? "border-brand-200 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <History size={13} /> History
                      </button>
                      <button
                        onClick={() => handleSync(s.id)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing…" : "Sync now"}
                      </button>
                    </div>
                  </div>

                  {configExpandedId === s.id && configs[s.id] && (
                    <div className="mt-3 space-y-3 border-t border-stone-100 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                        Connection credentials
                      </p>
                      <p className="-mt-2 text-[11px] text-stone-400">
                        Stored server-side for this session only. Secret fields are masked everywhere except right after you type them.
                      </p>
                      {configs[s.id].fields.map((f) => (
                        <label key={f.key} className="block text-xs">
                          <span className="mb-1 flex items-center gap-1 font-medium text-stone-600">
                            {f.label}
                            {f.required && <span className="text-rose-500">*</span>}
                          </span>
                          <input
                            type={f.secret ? "password" : "text"}
                            placeholder={f.placeholder}
                            value={drafts[s.id]?.[f.key] ?? ""}
                            onChange={(e) =>
                              setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [f.key]: e.target.value } }))
                            }
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 outline-none focus:border-brand-400"
                          />
                          {f.secret && configs[s.id].maskedValues.find((m) => m.key === f.key)?.value && !drafts[s.id]?.[f.key] && (
                            <span className="mt-1 block text-[10px] text-stone-400">
                              Currently set: {configs[s.id].maskedValues.find((m) => m.key === f.key)?.value}
                            </span>
                          )}
                        </label>
                      ))}
                      {configError[s.id] && <p className="text-[11px] text-rose-600">{configError[s.id]}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveConfig(s.id)}
                          disabled={savingConfigId === s.id}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {savingConfigId === s.id ? "Saving…" : "Save configuration"}
                        </button>
                        {configs[s.id].configured && (
                          <span className="text-[11px] text-emerald-600">
                            Configured {configs[s.id].configuredAt ? relativeTime(configs[s.id].configuredAt!) : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {lastMessage[s.id] && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      <Sparkles size={13} className="mt-0.5 shrink-0" />
                      <span>{lastMessage[s.id]}</span>
                    </div>
                  )}

                  {expandedId === s.id && (
                    <div className="mt-3 border-t border-stone-100 pt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Recent sync activity</p>
                      {loadingLog === s.id && <p className="text-xs text-stone-400">Loading…</p>}
                      {loadingLog !== s.id && (logs[s.id]?.length ?? 0) === 0 && (
                        <p className="text-xs text-stone-400">No sync activity yet this session — click "Sync now" to trigger one.</p>
                      )}
                      <div className="space-y-1.5">
                        {(logs[s.id] ?? []).map((entry) => (
                          <div key={entry.id} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-stone-600">{entry.summary}</span>
                            <span className="shrink-0 whitespace-nowrap text-stone-400">{relativeTime(entry.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="px-8 py-6">
          <div className="max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">HR</div>
              <div>
                <p className="text-sm font-bold text-stone-900">HR Admin</p>
                <p className="text-xs text-stone-400">People Operations</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <dt className="text-stone-400">Role</dt>
                <dd className="font-medium text-stone-700">HR Persona (Admin)</dd>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <dt className="text-stone-400">Access scope</dt>
                <dd className="font-medium text-stone-700">All departments</dd>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <dt className="text-stone-400">Notifications</dt>
                <dd className="font-medium text-stone-700">Weekly reskilling digest</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-stone-400">Only the HR persona is available in this build — manager and employee views are planned for a later phase.</p>
          </div>
        </div>
      )}
    </div>
  );
}
