import { Users, Award, Calendar, Search } from "lucide-react";
import { useState } from "react";

interface EnrolledStudentsTabProps {
  students: any[];
}

export function EnrolledStudentsTab({ students = [] }: EnrolledStudentsTabProps) {
  const [query, setQuery] = useState("");

  const filtered = students.filter((s) => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search enrolled students..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850/80">
          <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No matching students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s, idx) => (
            <div key={idx} className="p-4 rounded-3xl border border-zinc-200/60 dark:border-zinc-805 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-xs">
                  {s.name[0]}
                </div>
                <div>
                  <span className="text-xs font-black text-zinc-900 dark:text-white block">{s.name}</span>
                  <span className="text-[10px] text-zinc-450 dark:text-zinc-450 font-medium block mt-0.5">{s.email}</span>
                  <span className="text-[9px] text-zinc-400 font-bold block mt-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Enrolled: {new Date(s.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Progress & Badge */}
              <div className="text-right space-y-1">
                <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-200 block">{s.progress}%</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                  s.status === "COMPLETED" 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-blue-500/10 text-blue-500"
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
