import { memo } from "react";
import { Link } from "react-router-dom";
import { Play, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/config/routes.config";
import type { DashboardCourse } from "@/types/dashboard.types";
import { useState } from "react";
import { useMemo } from "react";

interface MyLearningCardProps {
  courses: DashboardCourse[];
  isLoading: boolean;
}

const statusBadge: Record<string, "success" | "primary" | "danger" | "secondary"> = {
  COMPLETED: "success",
  ACTIVE: "primary",
  EXPIRED: "danger",
};

function CourseRow({ course }: { course: DashboardCourse }) {
  const isCompleted = course.status === "COMPLETED";
  const statusLabel = isCompleted ? "Completed" : course.status === "ACTIVE" ? "In Progress" : "Expired";

  return (
    <div className="group flex flex-col md:flex-row items-stretch gap-5 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/50 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all duration-300">
      {/* Course Thumbnail */}
      <div className="relative w-full md:w-44 h-28 rounded-xl bg-zinc-100 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 shrink-0 flex items-center justify-center overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550" />
        ) : (
          <BookOpen className="h-7 w-7 text-zinc-400 dark:text-zinc-600" />
        )}
      </div>

      {/* Course Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {course.categoryName && (
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-750/50 px-2 py-0.5 rounded-md">
                {course.categoryName}
              </span>
            )}
            <Badge variant={isCompleted ? "success" : course.status === "ACTIVE" ? "primary" : "danger"} className="text-[9px] font-bold tracking-wider py-0 px-2 rounded-md">
              {statusLabel}
            </Badge>
          </div>
          <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mt-2 line-clamp-1 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            {course.title}
          </h4>
          <p className="mt-1 text-xs text-zinc-450 dark:text-zinc-500 font-medium">
            Instructor: <span className="text-zinc-600 dark:text-zinc-400">{course.instructorName}</span> &bull; {course.totalLessons} Lessons
          </p>
        </div>

        {/* Progress Section */}
        <div className="mt-4 w-full max-w-sm">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-450 dark:text-zinc-400 mb-1.5">
            <span>{Math.round(course.completionPercentage)}% complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-emerald-500" : "bg-blue-600"}`}
              style={{ width: `${Math.min(course.completionPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center md:justify-end shrink-0 pt-4 md:pt-0">
        <Link
          to={isCompleted ? ROUTES.certificates : `${ROUTES.player}?courseId=${course.courseId}`}
          className="w-full md:w-auto"
        >
          <Button
            size="sm"
            variant={isCompleted ? "outline" : "primary"}
            className={`w-full md:w-auto text-xs font-bold px-5 py-2.5 rounded-xl h-10 ${
              isCompleted
                ? "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 text-zinc-650 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
            }`}
          >
            {isCompleted ? (
              "Claim Certificate"
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                Resume Learning
              </>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export const MyLearningCard = memo(function MyLearningCard({ courses, isLoading }: MyLearningCardProps) {
  const [showAll, setShowAll] = useState(false);

  const displayed = useMemo(
    () => (showAll ? courses : courses.slice(0, 5)),
    [courses, showAll],
  );

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <Skeleton className="h-5 w-28 bg-zinc-150 dark:bg-zinc-900" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
              <Skeleton className="w-44 h-28 rounded-xl shrink-0 bg-zinc-150 dark:bg-zinc-800" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-900" />
                <Skeleton className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-900" />
                <Skeleton className="h-2 w-full max-w-xs rounded-full bg-zinc-150 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">My Learning ({courses.length})</h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4 mt-2">
          {displayed.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </div>
        {courses.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center gap-1 mx-auto mt-4 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350 py-2 w-full hover:bg-zinc-50 dark:hover:bg-zinc-850/30 rounded-xl transition"
            aria-expanded={showAll}
          >
            {showAll ? (
              <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>Show All ({courses.length} courses) <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
});
