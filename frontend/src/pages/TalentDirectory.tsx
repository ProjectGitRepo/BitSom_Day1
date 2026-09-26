import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../types";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import EmployeeDetail from "../components/EmployeeDetail";

const departments = ["All", "Product", "Engineering", "Data", "Design", "Business", "Security", "Marketing", "Sales", "HR", "Finance"];

export default function TalentDirectory() {
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [department, setDepartment] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("focus"));
  const [loading, setLoading] = useState(false);

  const runSearch = () => {
    setLoading(true);
    api
      .listEmployees({ department, q: query })
      .then((res) => setEmployees(res.employees))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Agent 1 · Talent Data Aggregator"
        title="Talent 360"
        description="One unified profile per employee — pulled from employee records, resumes & certifications, project history, skills mapping, manager feedback, and LMS — so no manual cross-referencing is needed."
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col border-r border-stone-200 xl:w-[58%]">
          <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-6 py-3.5">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search by name, title, or skill…"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-8.5 pr-3 text-sm outline-none ring-brand-500/30 focus:border-brand-400 focus:ring-2"
                style={{ paddingLeft: "2.1rem" }}
              />
            </div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600 outline-none focus:border-brand-400"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={runSearch}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Search
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-6 py-2.5 font-semibold">Employee</th>
                  <th className="px-3 py-2.5 font-semibold">Department</th>
                  <th className="px-3 py-2.5 font-semibold">Top skills</th>
                  <th className="px-3 py-2.5 font-semibold">Tenure</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`cursor-pointer border-b border-stone-100 transition-colors hover:bg-brand-50/40 ${selectedId === e.id ? "bg-brand-50" : "bg-white"}`}
                  >
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.name} color={e.avatarColor} size={30} />
                        <div>
                          <p className="text-xs font-semibold text-stone-800">{e.name}</p>
                          <p className="flex items-center gap-1 text-[11px] text-stone-400">
                            {e.title} <MapPin size={10} className="ml-1" /> {e.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">{e.department}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {e.topSkills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-500">{e.tenureYears}y</td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-stone-400">No employees match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-stone-100 bg-white px-6 py-2 text-xs text-stone-400">
            {loading ? "Searching…" : `${employees.length} employees`}
          </div>
        </div>

        <div className="hidden flex-1 bg-white xl:block">
          {selectedId ? (
            <EmployeeDetail employeeId={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm text-stone-400">
              Select an employee to view their unified 360 profile — aggregated automatically from every fragmented system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
