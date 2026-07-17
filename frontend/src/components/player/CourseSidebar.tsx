import React, { useState } from "react";
import { Search, ChevronDown, ChevronRight, Lock, CheckCircle2, Play, FileText, BookOpen, AlertCircle, HelpCircle } from "lucide-react";
import { CourseStructure, PlayerModule, PlayerLesson } from "@/services/player.service";

interface CourseSidebarProps {
  structure: CourseStructure;
  activeLessonId: string | null;
  onSelectLesson: (lesson: PlayerLesson) => void;
  unlockedLessonIds: Set<string>;
}

export function CourseSidebar({
  structure,
  activeLessonId,
  onSelectLesson,
  unlockedLessonIds,
}: CourseSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    // Expand first module by default
    const initial: Record<string, boolean> = {};
    if (structure.modules.length > 0) {
      initial[structure.modules[0].id] = true;
    }
    return initial;
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const getLessonIcon = (type: string, completed: boolean, locked: boolean) => {
    if (locked) return <Lock className="h-4 w-4 text-zinc-500" />;
    if (completed) return <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />;
    switch (type) {
      case "VIDEO":
        return <Play className="h-4 w-4 text-blue-500 fill-blue-500/10" />;
      case "PDF":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "ARTICLE":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  // Filter modules/lessons based on search
  const filteredModules = structure.modules
    .map((m) => {
      const lessons = m.lessons.filter((l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...m, lessons };
    })
    .filter((m) => m.lessons.length > 0);

  return (
    <div className="w-80 border-r border-zinc-800/80 bg-zinc-900 text-zinc-100 flex flex-col h-full select-none">
      {/* Sidebar Header Search */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20">
        <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-3">
          Course Curriculum
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800/60 focus:border-blue-500/80 text-zinc-200 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Accordion Modules List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredModules.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No lessons matched your search.
          </div>
        ) : (
          filteredModules.map((module) => {
            const isExpanded = !!expandedModules[module.id];
            const completedCount = module.lessons.filter((l) => l.progress.completed).length;

            return (
              <div
                key={module.id}
                className="border border-zinc-800/40 rounded-2xl overflow-hidden bg-zinc-950/10"
              >
                {/* Module Trigger Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/30 bg-zinc-950/20 transition duration-200 focus:outline-none"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-xs font-black text-zinc-200 truncate">
                      {module.title}
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-500 block mt-0.5">
                      {completedCount} / {module.lessons.length} Lessons completed
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                  )}
                </button>

                {/* Module Lessons Items */}
                {isExpanded && (
                  <div className="bg-zinc-950/10 divide-y divide-zinc-800/40">
                    {module.lessons.map((lesson) => {
                      const isLocked = !unlockedLessonIds.has(lesson.id);
                      const isActive = activeLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          disabled={isLocked}
                          onClick={() => onSelectLesson(lesson)}
                          className={`w-full p-3 flex items-start gap-3 text-left transition relative focus:outline-none lesson-item ${
                            isActive
                              ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 pl-2.5"
                              : "hover:bg-zinc-800/10 text-zinc-400"
                          } ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {getLessonIcon(lesson.lessonType, lesson.progress.completed, isLocked)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold block leading-tight truncate">
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-zinc-550 font-bold">
                                {Math.round(lesson.durationSeconds / 60)} mins
                              </span>
                              {lesson.progress.watchPercentage > 0 && !lesson.progress.completed && (
                                <span className="text-[9px] text-blue-500 font-bold">
                                  {Math.round(lesson.progress.watchPercentage)}% watched
                                </span>
                              )}
                              {lesson.progress.lastPageRead > 0 && !lesson.progress.completed && (
                                <span className="text-[9px] text-amber-500 font-bold">
                                  Page {lesson.progress.lastPageRead} read
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
