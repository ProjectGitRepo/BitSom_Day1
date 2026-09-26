import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Quote, CheckCircle2, XCircle, Sparkles, ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import type { MatchResult, RoleSummary } from "../types";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import ScoreBar from "../components/ScoreBar";
import InfoHint from "../components/InfoHint";
import { SkillFitContent, EvidenceFitContent } from "../components/ScoreExplain";

export default function CapabilitySearch() {
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [roleId, setRoleId] = useState<string>("");
  const [freeText, setFreeText] = useState(searchParams.get("q") ?? "");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.capabilitySearch>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listRoles().then((r) => setRoles(r.roles));
  }, []);

  const runSearchWith = async (rId: string, q: string) => {
    if (!rId && !q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.capabilitySearch({ roleId: rId || undefined, q: q || undefined, limit: 20 });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = () => runSearchWith(roleId, freeText);

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl) runSearchWith("", fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Agent 2 · Capability-to-Role Mapping"
        title="Capability search"
        description="Ask for what you actually need — the agent interprets it against evidence in resumes, project records, and manager feedback, not just job titles."
      />

      <div className="border-b border-stone-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Sparkles size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder='Try: "I need someone who can gather requirements and manage stakeholders"'
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-3 text-sm outline-none ring-brand-500/30 focus:border-brand-400 focus:ring-2"
            />
          </div>
          <button onClick={runSearch} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            <Search size={15} className="inline -mt-0.5 mr-1.5" />
            Search
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={() => setShowRolePicker((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            Narrow to a specific role (optional) <ChevronDown size={13} className={showRolePicker ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {roleId && (
            <button onClick={() => setRoleId("")} className="text-xs font-medium text-brand-600 hover:underline">
              Clear role filter
            </button>
          )}
        </div>

        {showRolePicker && (
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="mt-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-brand-400"
          >
            <option value="">— let the agent interpret my query —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        )}

        {result?.detectedRole && !roleId && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
            <Sparkles size={13} />
            Interpreted as <strong>{result.detectedRole.title}</strong>
            <span className="text-violet-400">({Math.round(result.detectedRole.confidence * 100)}% confidence)</span>
          </div>
        )}

        {result && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs font-medium text-stone-400">Evidence phrases used:</span>
            {result.searchedRole.evidenceKeywords.slice(0, 10).map((k) => (
              <span key={k} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">{k}</span>
            ))}
          </div>
        )}
      </div>

      <div className="px-8 py-6">
        {loading && <p className="text-sm text-stone-400">Scoring candidates against evidence…</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && !result && !error && (
          <p className="text-sm text-stone-400">Describe the capability you need, then click Search to rank candidates.</p>
        )}
        {!loading && result && (
          <>
            <p className="mb-4 text-xs text-stone-400">
              {result.matches.length} ranked out of {result.totalCandidates} employees
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {result.matches.map((m) => (
                <MatchCard key={m.employeeId} match={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchResult }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={match.name} color={match.avatarColor} size={38} />
          <div>
            <p className="text-sm font-bold text-stone-900">{match.name}</p>
            <p className="text-xs text-stone-500">{match.title} · {match.department}</p>
          </div>
        </div>
        <StatusBadge tier={match.tier} />
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Overall match</span>
        </div>
        <ScoreBar score={match.score} />
        <div className="flex gap-4 pt-0.5 text-[11px] text-stone-400">
          <span className="inline-flex items-center gap-1">
            Skills fit: <strong className="text-stone-600">{match.skillScore}</strong>
            <InfoHint>
              <SkillFitContent matchedSkills={match.matchedSkills} missingSkills={match.missingSkills} adjacentSkills={match.adjacentSkills} />
            </InfoHint>
          </span>
          <span className="inline-flex items-center gap-1">
            Evidence fit: <strong className="text-stone-600">{match.evidenceScore}</strong>
            <InfoHint>
              <EvidenceFitContent evidence={match.evidence} />
            </InfoHint>
          </span>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 rounded-lg bg-violet-50/60 px-3 py-2 text-[11px] leading-relaxed text-violet-800">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-violet-500" />
        <span>{match.rationale}</span>
      </div>

      {match.matchedSkills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {match.matchedSkills.slice(0, 5).map((s) => (
            <span
              key={s.name}
              title={`${Math.round(s.confidence * 100)}% confidence — evidence-weighted, decays if not re-verified`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              <CheckCircle2 size={10} />{s.name}
            </span>
          ))}
          {match.missingSkills.slice(0, 3).map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
              <XCircle size={10} />{s.name}
            </span>
          ))}
        </div>
      )}

      {match.evidence.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3">
          {match.evidence.slice(0, 2).map((ev, i) => (
            <div key={i} className="flex gap-1.5 text-[11px] text-stone-500">
              <Quote size={12} className="mt-0.5 shrink-0 text-brand-400" />
              <span>
                <span className="italic">"{ev.excerpt}"</span>{" "}
                <span className="text-stone-400">— {ev.label}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
