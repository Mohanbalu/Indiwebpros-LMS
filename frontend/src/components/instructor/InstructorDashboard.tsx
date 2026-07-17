import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, BookOpen, Users, ClipboardList, HelpCircle, Award, 
  TrendingUp, Plus, Trash, Edit3, Save, Check, CheckCircle2, XCircle, 
  AlertCircle, ArrowRight, ChevronRight, ChevronDown, Play, FileText, 
  PlusCircle, Sparkles, LogOut, Search, Clock, ShieldAlert, GraduationCap,
  Activity, Star, Copy, ArrowUp, ArrowDown, Layers, Video, File, 
  FolderPlus, Settings, CheckSquare, Settings2, Trash2, Edit2, Edit, Link
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { MediaUploader } from "@/components/instructor/MediaUploader";
import { CourseSettingsTab } from "@/components/instructor/CourseSettingsTab";
import { LessonEditorModal } from "@/components/instructor/LessonEditorModal";
import { AssessmentTab } from "@/components/instructor/AssessmentTab";
import { EnrolledStudentsTab } from "@/components/instructor/EnrolledStudentsTab";
import { 
  useInstructorDashboard, 
  useInstructorCourses, 
  useInstructorStudents, 
  useInstructorAssignments, 
  useInstructorQuizzes, 
  useInstructorCertificates, 
  useInstructorAnalytics,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  usePublishCourseMutation,
  useArchiveCourseMutation,
  useDuplicateCourseMutation,
  useDeleteCourseMutation,
  useReviewSubmissionMutation
} from "@/hooks/useInstructor";

export function InstructorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  const { user } = useAuth();
  
  // Queries
  const { data: dashData, isLoading: dashLoading, refetch: dashRefetch } = useInstructorDashboard();
  const { data: coursesData, isLoading: coursesLoading, refetch: coursesRefetch } = useInstructorCourses();
  const { data: studentsData, isLoading: studentsLoading } = useInstructorStudents();
  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: assignmentsRefetch } = useInstructorAssignments();
  const { data: quizzesData, isLoading: quizzesLoading, refetch: quizzesRefetch } = useInstructorQuizzes();
  const { data: certificatesData, isLoading: certificatesLoading } = useInstructorCertificates();
  
  // Selected course for editing outline/wizard
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Active view switcher helper
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setSelectedCourseId(null);
    setIsCreatingCourse(false);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Creator Studio
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 font-medium">
            Welcome back, {dashData?.welcome?.instructorName || user?.firstName}. Manage pathways, review builds, and track developer milestones.
          </p>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              setIsCreatingCourse(true);
              setSearchParams({ tab: "courses" });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" /> Create Course
          </Button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB COMPONENT */}
      {activeTab === "dashboard" && (
        <DashboardView 
          data={dashData} 
          isLoading={dashLoading} 
          onNavigate={handleTabChange}
          refetch={dashRefetch}
        />
      )}

      {activeTab === "courses" && (
        <CoursesView 
          data={coursesData} 
          isLoading={coursesLoading} 
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          isCreatingCourse={isCreatingCourse}
          setIsCreatingCourse={setIsCreatingCourse}
          refetch={coursesRefetch}
        />
      )}

      {activeTab === "students" && (
        <StudentsView 
          data={studentsData} 
          isLoading={studentsLoading} 
        />
      )}

      {activeTab === "assignments" && (
        <AssignmentsView 
          data={assignmentsData} 
          isLoading={assignmentsLoading} 
          refetch={assignmentsRefetch}
        />
      )}

      {activeTab === "quizzes" && (
        <QuizzesView 
          data={quizzesData} 
          isLoading={quizzesLoading}
          refetch={quizzesRefetch}
        />
      )}

      {activeTab === "certificates" && (
        <CertificatesView 
          data={certificatesData} 
          isLoading={certificatesLoading} 
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsView 
          data={dashData} 
          isLoading={dashLoading} 
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function DashboardView({ data, isLoading, onNavigate, refetch }: any) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-80 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Fallback stats values if data fields are missing
  const stats = [
    { label: "Active Enrolled", value: data?.welcome?.totalStudents ?? 0, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Active Pathways", value: data?.welcome?.totalCourses ?? 0, icon: BookOpen, color: "text-indigo-500 bg-indigo-500/10" },
    { label: "Pending Reviews", value: data?.assignments?.pendingReviews ?? 0, icon: ClipboardList, color: "text-rose-500 bg-rose-500/10" },
    { label: "Issued Certs", value: data?.certificates?.issuedCount ?? 0, icon: Award, color: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-900 border border-zinc-800 select-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Studio Welcome</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">Good Morning, Instructor 👋</h2>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed font-medium">
            Your capstone developer networks are active. You have {data?.assignments?.pendingReviews ?? 0} assignment submissions awaiting review and grading loops.
          </p>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white block mt-1.5">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 66% - Activities Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-6">Recent Studio Activity</h3>
            
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <div className="py-12 text-center">
                <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No recent activities logged</p>
              </div>
            ) : (
              <div className="relative border-l border-zinc-150 dark:border-zinc-800/80 pl-6 space-y-6">
                {data.recentActivity.map((act: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Bullet marker */}
                    <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-blue-600" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white block">{act.studentName}</span>
                        <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium block mt-1">{act.details}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 33% - Performing pathways & Analytics preview */}
        <div className="space-y-6">
          
          {/* Top Performing Pathway */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-5">Top Pathway</h3>
            {data?.performanceMetrics?.topPerforming ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block truncate">{data.performanceMetrics.topPerforming.title}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">{data.performanceMetrics.topPerforming.enrollmentsCount} enrolled</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">Completion Rate</span>
                  <span className="font-extrabold text-emerald-500">{data.performanceMetrics.topPerforming.completionRate.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider py-4 text-center">Data pending enrollment logs</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-5">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate("courses")} 
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:-translate-y-0.5 transition duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-zinc-950 dark:text-zinc-200">Manage Courses</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </button>
              <button 
                onClick={() => onNavigate("assignments")} 
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:-translate-y-0.5 transition duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-950 dark:text-zinc-200">Grade Submissions</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COURSES VIEW & CREATOR WIZARD
// ─────────────────────────────────────────────────────────────────────────────
function CoursesView({ data, isLoading, selectedCourseId, setSelectedCourseId, isCreatingCourse, setIsCreatingCourse, refetch }: any) {
  const [wizardStep, setWizardStep] = useState(1);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    difficulty: "BEGINNER",
    price: 199.00,
    isFree: false,
  });

  // Queries for dynamic wizard details
  const { data: categories } = useQuery({
    queryKey: ["categoriesList"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data;
    }
  });

  // Auto-select first category if available
  useEffect(() => {
    if (categories?.data?.length && !courseForm.categoryId) {
      setCourseForm((prev) => ({ ...prev, categoryId: categories.data[0].id }));
    }
  }, [categories, courseForm.categoryId]);

  const isTitleValid = courseForm.title.trim().length >= 5;
  const isDescValid = courseForm.description.trim().length >= 20;
  const isCategoryValid = courseForm.categoryId !== "";
  const isStep1Valid = isTitleValid && isDescValid && isCategoryValid;

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [courseEditTab, setCourseEditTab] = useState("curriculum");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Course Details query when course is selected
  const { data: activeCourseDetail, refetch: refetchActiveCourse } = useQuery({
    queryKey: ["creatorCourseDetails", selectedCourseId],
    queryFn: async () => {
      const res = await api.get(`/dashboard/instructor/course/${selectedCourseId}`);
      return res.data.data;
    },
    enabled: !!selectedCourseId
  });

  // Synchronize editingLesson when activeCourseDetail changes (refetched after updates)
  useEffect(() => {
    if (editingLesson && activeCourseDetail?.modules) {
      for (const mod of activeCourseDetail.modules) {
        if (mod.lessons) {
          const updatedLesson = mod.lessons.find((l: any) => l.id === editingLesson.id);
          if (updatedLesson) {
            setEditingLesson(updatedLesson);
            break;
          }
        }
      }
    }
  }, [activeCourseDetail, editingLesson?.id]);

  // Mutations
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation();
  const publishMutation = usePublishCourseMutation();
  const archiveMutation = useArchiveCourseMutation();
  const duplicateMutation = useDuplicateCourseMutation();
  const deleteMutation = useDeleteCourseMutation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
        ))}
      </div>
    );
  }

  // Handle new course wizard submission
  const handleCreateCourse = async () => {
    try {
      const res = await createMutation.mutateAsync({
        title: courseForm.title,
        description: courseForm.description,
        categoryId: courseForm.categoryId || (categories?.data?.[0]?.id),
        difficulty: courseForm.difficulty,
        price: courseForm.isFree ? 0 : Number(courseForm.price),
        status: "DRAFT"
      });
      if (res?.data?.success && res.data.data?.id) {
        setSelectedCourseId(res.data.data.id);
        setIsCreatingCourse(false);
        setWizardStep(3); // Go straight to curriculum step!
        refetch();
      }
    } catch (err) {
      console.error("Create course failure:", err);
    }
  };

  // Add Module Mutation
  const handleAddModule = async () => {
    if (!newModuleTitle || !selectedCourseId) return;
    try {
      await api.post(`/courses/${selectedCourseId}/modules`, {
        title: newModuleTitle,
        description: "",
        sortOrder: (activeCourseDetail?.modules?.length ?? 0) + 1
      });
      setNewModuleTitle("");
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Lesson Mutation
  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle) return;
    try {
      await api.post(`/courses/modules/${moduleId}/lessons`, {
        title: newLessonTitle,
        lessonType: "VIDEO",
        durationSeconds: 15 * 60,
        sortOrder: 1
      });
      setNewLessonTitle("");
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };
  // Rename Module
  const handleRenameModule = async (moduleId: string) => {
    if (!editingModuleTitle.trim()) return;
    try {
      await api.put(`/courses/modules/${moduleId}`, { title: editingModuleTitle });
      setEditingModuleId(null);
      setEditingModuleTitle("");
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: string) => {
    try {
      await api.delete(`/courses/modules/${moduleId}`);
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  // Move Module Up/Down
  const handleMoveModule = async (moduleId: string, direction: "up" | "down") => {
    const modules = [...(activeCourseDetail?.modules || [])];
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const temp = modules[idx];
    modules[idx] = modules[targetIdx];
    modules[targetIdx] = temp;

    const items = modules.map((m, index) => ({
      id: m.id,
      sortOrder: index + 1,
    }));

    try {
      await api.patch(`/courses/${selectedCourseId}/modules/reorder`, { items });
      refetchActiveCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // Move Lesson Up/Down
  const handleMoveLesson = async (moduleId: string, lessonId: string, direction: "up" | "down") => {
    const mod = activeCourseDetail?.modules?.find((m: any) => m.id === moduleId);
    if (!mod || !mod.lessons) return;
    const lessons = [...mod.lessons];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const temp = lessons[idx];
    lessons[idx] = lessons[targetIdx];
    lessons[targetIdx] = temp;

    const items = lessons.map((l, index) => ({
      id: l.id,
      sortOrder: index + 1,
    }));

    try {
      await api.patch(`/courses/modules/${moduleId}/lessons/reorder`, { items });
      refetchActiveCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  // Duplicate Lesson (Clone)
  const handleDuplicateLesson = async (moduleId: string, lesson: any) => {
    try {
      await api.post(`/courses/modules/${moduleId}/lessons`, {
        title: `${lesson.title} (Copy)`,
        description: lesson.description || "",
        videoId: lesson.videoId || null,
        durationSeconds: lesson.durationSeconds || 0,
        lessonType: lesson.lessonType || "VIDEO",
        isPreview: lesson.isPreview || false,
        sortOrder: (lesson.sortOrder || 0) + 1,
      });
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  // Move Lesson to another module
  const handleMoveLessonToModule = async (oldModuleId: string, newModuleId: string, lesson: any) => {
    try {
      await api.post(`/courses/modules/${newModuleId}/lessons`, {
        title: lesson.title,
        description: lesson.description || "",
        videoId: lesson.videoId || null,
        durationSeconds: lesson.durationSeconds || 0,
        lessonType: lesson.lessonType || "VIDEO",
        isPreview: lesson.isPreview || false,
        sortOrder: 1,
      });
      await api.delete(`/courses/lessons/${lesson.id}`);
      refetchActiveCourse();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishCourse = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      refetch();
      if (selectedCourseId) refetchActiveCourse();
    } catch (e) { console.error(e); }
  };
  const handleArchiveCourse = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      refetch();
      if (selectedCourseId) refetchActiveCourse();
    } catch (e) { console.error(e); }
  };

  const handleDuplicateCourse = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
      setSelectedCourseId(null);
      refetch();
    } catch (e) { console.error(e); }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setSelectedCourseId(null);
      refetch();
    } catch (e) { console.error(e); }
  };

  // RENDER: Create Course Wizard Modal / View
  if (isCreatingCourse) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8 select-none">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Step {wizardStep} of 2</span>
          <div className="h-1.5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(wizardStep / 2) * 100}%` }} />
          </div>
        </div>

        {wizardStep === 1 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Basic Info</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Define your pathway title, category and difficulty level.</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Course Title</label>
              <input 
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                placeholder="Advanced Full Stack Developer Pathway"
              />
              <span className={`text-[10px] font-bold block mt-1 ${
                courseForm.title.trim().length === 0
                  ? "text-zinc-400 dark:text-zinc-500"
                  : isTitleValid
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}>
                Title must be at least 5 characters. Current: {courseForm.title.trim().length}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Description</label>
              <textarea 
                rows={4}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                placeholder="Provide a detailed roadmap explaining outcomes..."
              />
              <span className={`text-[10px] font-bold block mt-1 ${
                courseForm.description.trim().length === 0
                  ? "text-zinc-400 dark:text-zinc-500"
                  : isDescValid
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}>
                Description must be at least 20 characters. Current: {courseForm.description.trim().length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Category</label>
                <select 
                  value={courseForm.categoryId}
                  onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Difficulty</label>
                <select 
                  value={courseForm.difficulty}
                  onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <Button type="button" variant="outline" onClick={() => setIsCreatingCourse(false)} className="flex-1 py-3">Cancel</Button>
              <Button type="button" onClick={() => setWizardStep(2)} disabled={!isStep1Valid} className="flex-1 py-3 bg-blue-600 text-white">Next</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Pricing Setup</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Configure one-time fee structures or free pathway enrollments.</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-855 select-none">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">Free Pathway</span>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-550 block mt-0.5">Allow public access without charge</span>
              </div>
              <input 
                type="checkbox"
                checked={courseForm.isFree}
                onChange={(e) => setCourseForm({ ...courseForm, isFree: e.target.checked })}
                className="h-5 w-5 rounded border-zinc-200 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {!courseForm.isFree && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">One-time Price ($ USD)</label>
                <input 
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs sm:text-sm focus:outline-none"
                  placeholder="199.00"
                />
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <Button type="button" variant="outline" onClick={() => setWizardStep(1)} className="flex-1 py-3">Back</Button>
              <Button 
                type="button" 
                onClick={handleCreateCourse} 
                disabled={createMutation.isPending}
                className="flex-1 py-3 bg-blue-600 text-white font-bold"
              >
                {createMutation.isPending ? "Creating..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: Edit Curriculum / Syllabus Screen for a selected course
  if (selectedCourseId) {
    if (!activeCourseDetail) {
      return <div className="p-8 text-center text-xs font-bold text-zinc-400">Loading pathway workspace...</div>;
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Back header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-850 pb-5">
          <div className="space-y-1">
            <button 
              onClick={() => { setSelectedCourseId(null); refetch(); }}
              className="text-xs font-bold text-zinc-550 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5"
            >
              ← Back to Course Workspace
            </button>
            <h2 className="text-lg font-black text-zinc-950 dark:text-white uppercase mt-2">{activeCourseDetail.title}</h2>
          </div>
          
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Status Badge */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              activeCourseDetail.status === "PUBLISHED" 
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                : activeCourseDetail.status === "ARCHIVED"
                ? "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
            }`}>
              {activeCourseDetail.status}
            </span>

            {/* Lifecycle Actions */}
            {activeCourseDetail.status !== "PUBLISHED" && (
              <Button 
                onClick={() => handlePublishCourse(activeCourseDetail.id)}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Publish
              </Button>
            )}

            {activeCourseDetail.status === "PUBLISHED" && (
              <Button 
                onClick={() => handleArchiveCourse(activeCourseDetail.id)}
                className="py-1.5 px-3 bg-zinc-600 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl"
              >
                Archive
              </Button>
            )}

            <Button 
              onClick={() => handleDuplicateCourse(activeCourseDetail.id)}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Duplicate
            </Button>

            <Button 
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: "Delete Course Pathway",
                  message: "Are you sure you want to permanently delete this course? This action is irreversible and will delete all associated modules, lessons, and reviews.",
                  onConfirm: () => handleDeleteCourse(activeCourseDetail.id),
                });
              }}
              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {[
            { id: "curriculum", label: "Curriculum outline" },
            { id: "settings", label: "Pathway Settings" },
            { id: "assessments", label: "Quizzes & Assignments" },
            { id: "students", label: "Enrolled Students" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCourseEditTab(tab.id)}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
                courseEditTab === tab.id 
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" 
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace views switch */}
        {courseEditTab === "curriculum" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (66%) - Curriculum Outline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white tracking-tight uppercase">Pathway Curriculum outline</h3>
                  <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-bold block mt-1">Configure your course syllabus layout, add interactive modules, and manage lesson items.</p>
                </div>

                {/* Modules tree */}
                <div className="space-y-4">
                  {(activeCourseDetail?.modules || []).map((mod: any, mIdx: number) => (
                    <div key={mod.id} className="rounded-2xl border border-zinc-150 dark:border-zinc-850 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
                      
                      {/* Module Header row */}
                      <div className="w-full p-4 flex items-center justify-between bg-zinc-100/50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-855">
                        {editingModuleId === mod.id ? (
                          <div className="flex-1 flex gap-2">
                            <input 
                              type="text" 
                              value={editingModuleTitle}
                              onChange={(e) => setEditingModuleTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-bold"
                            />
                            <Button onClick={() => handleRenameModule(mod.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save</Button>
                            <button onClick={() => setEditingModuleId(null)} className="text-xs text-zinc-400 font-bold px-1">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                              className="flex items-center gap-2 text-left font-extrabold text-xs text-zinc-900 dark:text-white"
                            >
                              <BookOpen className="h-4.5 w-4.5 text-zinc-400" />
                              <span>{mod.title}</span>
                              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium ml-1">({mod.lessons?.length || 0} lessons)</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Module Up/Down */}
                          <button 
                            onClick={() => handleMoveModule(mod.id, "up")} 
                            disabled={mIdx === 0}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleMoveModule(mod.id, "down")} 
                            disabled={mIdx === (activeCourseDetail.modules.length - 1)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title); }}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: "Delete Curriculum Module",
                                message: "Are you sure you want to delete this module and all of its associated lessons? This action cannot be undone.",
                                onConfirm: () => handleDeleteModule(mod.id),
                              });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Lessons tree */}
                      {(activeModuleId === mod.id || activeCourseDetail.modules.length === 1) && (
                        <div className="p-4 bg-white dark:bg-zinc-900/50 space-y-3">
                          {mod.lessons?.map((les: any, lIdx: number) => (
                            <div key={les.id} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-855 flex items-center justify-between bg-zinc-50/40 dark:bg-zinc-950/10">
                              <div className="flex items-center gap-3">
                                {les.lessonType === "PDF" ? (
                                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                )}
                                <div>
                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{les.title}</span>
                                  <div className="flex gap-2 mt-0.5 select-none">
                                    <span className="text-[8px] font-black uppercase text-zinc-400">{les.lessonType}</span>
                                    {les.isPreview && (
                                      <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1 rounded">FREE PREVIEW</span>
                                    )}
                                    {les.status === "DRAFT" && (
                                      <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-1 rounded">DRAFT</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-2">{Math.round(les.durationSeconds / 60)} mins</span>
                                
                                {/* Lesson Actions */}
                                <button 
                                  onClick={() => handleMoveLesson(mod.id, les.id, "up")} 
                                  disabled={lIdx === 0}
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleMoveLesson(mod.id, les.id, "down")} 
                                  disabled={lIdx === (mod.lessons.length - 1)}
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                
                                <button 
                                  onClick={() => handleDuplicateLesson(mod.id, les)}
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="Duplicate Lesson"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>

                                <button 
                                  onClick={() => setEditingLesson(les)}
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="Configure Lesson settings"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>

                                <button 
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: "Delete Lesson",
                                      message: "Are you sure you want to permanently delete this lesson and its files? This action cannot be undone.",
                                      onConfirm: () => handleDeleteLesson(les.id),
                                    });
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Lesson form */}
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
                            <input 
                              type="text"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="New lesson title..."
                              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                            />
                            <button 
                              onClick={() => handleAddLesson(mod.id)}
                              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                              <Plus className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Module controller */}
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/50 flex gap-2">
                  <input 
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Create module (e.g. Introduction to setups)..."
                    className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button 
                    onClick={handleAddModule}
                    className="py-3 px-5 bg-blue-600 text-white text-xs font-bold rounded-xl"
                  >
                    Add Module
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column (33%) - Pathway Sidebar */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider block">Pathway Analytics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-450 font-bold">Students Enrolled</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">{activeCourseDetail?.stats?.totalStudents ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-450 font-bold">Completion Rate</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">{(activeCourseDetail?.stats?.completionRate ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-450 font-bold">Certificates Issued</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">{activeCourseDetail?.stats?.certificatesIssued ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Settings Tab switcher */}
        {courseEditTab === "settings" && (
          <CourseSettingsTab 
            courseDetail={activeCourseDetail}
            categories={categories?.data || []}
            onUpdate={async (data) => { await updateMutation.mutateAsync({ id: selectedCourseId, data }); }}
            refetch={refetchActiveCourse}
          />
        )}

        {/* Assessments (Quizzes/Assignments) switcher */}
        {courseEditTab === "assessments" && (
          <AssessmentTab 
            courseDetail={activeCourseDetail}
            refetch={refetchActiveCourse}
          />
        )}

        {/* Enrolled Students switcher */}
        {courseEditTab === "students" && (
          <EnrolledStudentsTab 
            students={activeCourseDetail.students}
          />
        )}

        {/* Modals Container */}
        <LessonEditorModal 
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          lesson={editingLesson}
          refetch={refetchActiveCourse}
        />

        <ConfirmationModal 
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </div>
    );
  }

  // RENDER: Creator Studio Course List view (Default)
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Status Summary Bar */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Published</span>
              <span className="text-xl font-black text-zinc-955 dark:text-white block mt-1">{data.published ?? 0}</span>
            </div>
            <div className="h-8 w-8 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Drafts</span>
              <span className="text-xl font-black text-zinc-955 dark:text-white block mt-1">{data.draft ?? 0}</span>
            </div>
            <div className="h-8 w-8 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
              ✎
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Under Review</span>
              <span className="text-xl font-black text-zinc-955 dark:text-white block mt-1">{data.underReview ?? 0}</span>
            </div>
            <div className="h-8 w-8 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
              ⌛
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Archived</span>
              <span className="text-xl font-black text-zinc-955 dark:text-white block mt-1">{data.archived ?? 0}</span>
            </div>
            <div className="h-8 w-8 rounded-2xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center font-bold text-sm">
              🗄
            </div>
          </div>
        </div>
      )}

      {(!data?.courses || data.courses.length === 0) ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
          <BookOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase">No Pathways Found</h3>
          <p className="text-xs text-zinc-450 dark:text-zinc-400 mt-2 font-medium max-w-xs mx-auto">Build your first expert pathway or developer curriculum layout from zero.</p>
          <Button 
            onClick={() => setIsCreatingCourse(true)} 
            className="mt-6 bg-blue-600 text-white font-bold rounded-2xl"
          >
            Create Course Studio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.courses.map((course: any) => (
            <div 
              key={course.id}
              className="group relative rounded-3xl border border-zinc-200/60 dark:border-zinc-850/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Thumbnail header */}
              <div className="h-40 w-full relative flex items-center justify-center p-6 select-none overflow-hidden bg-zinc-950">
                {course.thumbnailUrl ? (
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-505 group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-zinc-950/40 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                
                <BookOpen className="h-10 w-10 text-white/30 absolute top-4 left-4" />
                <span className="relative text-white font-black text-sm text-center leading-tight tracking-tight drop-shadow-md line-clamp-2 px-4 select-text selection:bg-blue-600/40">
                  {course.title}
                </span>
                
                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                    course.status === "PUBLISHED" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : course.status === "ARCHIVED"
                      ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    {course.status}
                  </span>
                </div>
              </div>

              {/* Details body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Category & Level Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {course.category?.name && (
                      <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {course.category.name}
                      </span>
                    )}
                    {course.difficulty && (
                      <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                        {course.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                    <span>{course.modulesCount} Modules</span>
                    <span>{course.lessonsCount} Lessons</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-4 text-xs font-bold text-zinc-655 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-zinc-400" /> Catalog Path</span>
                    <button 
                      onClick={() => setSelectedCourseId(course.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-extrabold flex items-center gap-1 transition"
                    >
                      Configure Outline <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STUDENT MANAGEMENT VIEW
// ─────────────────────────────────────────────────────────────────────────────
function StudentsView({ data, isLoading }: any) {
  const [query, setQuery] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-150 dark:bg-zinc-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  // Client side query match
  const filtered = data?.filter((student: any) => 
    student.name.toLowerCase().includes(query.toLowerCase()) || 
    student.email.toLowerCase().includes(query.toLowerCase()) ||
    student.courseTitle.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search Header */}
      <div className="relative group max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students, emails, paths..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
          <Users className="h-10 w-10 text-zinc-350 dark:text-zinc-650 mx-auto mb-3" />
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No matching student logs located</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((student: any, idx: number) => (
            <div key={idx} className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-805 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-xs">
                  {student.name[0]}
                </div>
                <div>
                  <span className="text-xs font-black text-zinc-900 dark:text-white block">{student.name}</span>
                  <span className="text-[10px] text-zinc-450 dark:text-zinc-400 font-medium block mt-0.5">{student.email}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-1.5">{student.courseTitle}</span>
                </div>
              </div>

              {/* Progress metric */}
              <div className="text-right">
                <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-200 block">{student.progressPercentage}%</span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">Progress</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ASSIGNMENT GRADING VIEW (Inbox style)
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentsView({ data, isLoading, refetch }: any) {
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState(85);
  const [statusVal, setStatusVal] = useState("GRADED");
  const [feedbackText, setFeedbackText] = useState("");

  const reviewMutation = useReviewSubmissionMutation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="h-96 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
        <div className="lg:col-span-2 h-96 bg-zinc-150 dark:bg-zinc-800 rounded-3xl" />
      </div>
    );
  }

  const submissions = data?.submissions || [];
  const selectedSub = submissions.find((s: any) => s.id === selectedSubId);

  const handleSubmitReview = async () => {
    if (!selectedSubId) return;
    try {
      await reviewMutation.mutateAsync({
        submissionId: selectedSubId,
        score: Number(gradeScore),
        status: statusVal,
        feedback: feedbackText,
      });
      setSelectedSubId(null);
      setFeedbackText("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      
      {/* Left submissions list */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-2 block">Inbox Submissions</h3>
        {submissions.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <ClipboardList className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No assignments uploaded yet</p>
          </div>
        ) : (
          submissions.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubId(sub.id);
                setGradeScore(sub.marks || 85);
                setFeedbackText("");
              }}
              className={`w-full p-4 rounded-2xl text-left border transition duration-200 block select-none ${
                selectedSubId === sub.id
                  ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20"
                  : "border-zinc-200/60 dark:border-zinc-850/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">{sub.studentName}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  sub.status === "GRADED" 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-amber-500/10 text-amber-500"
                }`}>
                  {sub.status}
                </span>
              </div>
              <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-medium block mt-1.5">{sub.assignmentTitle}</span>
              <span className="text-[9px] text-zinc-400 font-medium block mt-2">{new Date(sub.submittedAt).toLocaleDateString()}</span>
            </button>
          ))
        )}
      </div>

      {/* Right side Grading review portal */}
      <div className="lg:col-span-2">
        {selectedSub ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Submission review loop</span>
              <h3 className="text-lg font-black text-zinc-950 dark:text-white mt-1 leading-tight">{selectedSub.assignmentTitle}</h3>
              <p className="text-xs text-zinc-500 font-medium mt-1">Submitted by {selectedSub.studentName}</p>
            </div>

            {/* Mock Submission file render details */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-855/80 space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Submission content</span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                "Here is my completed capstone build setup. The database pool resolves dynamic connections cleanly. I verified the schemas mapping constraints inside postgres."
              </p>
              
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 pt-3 select-none">
                <FileText className="h-4 w-4" />
                <span className="hover:underline cursor-pointer">capstone_prisma_deployment.pdf</span>
              </div>
            </div>

            {/* Grading Form */}
            <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Score (Out of {selectedSub.maxMarks || 100})</label>
                  <input 
                    type="number"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs sm:text-sm focus:outline-none"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Review Status</label>
                  <select 
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:outline-none"
                  >
                    <option value="GRADED">Graded / Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400">Written Feedback</label>
                <textarea 
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs sm:text-sm focus:outline-none"
                  placeholder="Provide guidance on optimizations, constraints schemas structures..."
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isPending}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg"
              >
                {reviewMutation.isPending ? "Submitting Grading Review..." : "Submit Grading Review"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 min-h-[300px] flex flex-col justify-center select-none">
            <ClipboardList className="h-10 w-10 text-zinc-350 dark:text-zinc-650 mx-auto mb-3" />
            <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Select a student submission to begin grading feedback loop</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. QUIZZES VIEW & CREATOR
// ─────────────────────────────────────────────────────────────────────────────
function QuizzesView({ data, isLoading, refetch }: any) {
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passingPercentage: 70,
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");

  const quizzes = data?.quizzes || [];
  const activeQuiz = quizzes.find((q: any) => q.id === activeQuizId);

  const handleCreateQuiz = async () => {
    if (!quizForm.title) return;
    try {
      await api.post("/quizzes", {
        title: quizForm.title,
        description: quizForm.description,
        passingPercentage: Number(quizForm.passingPercentage)
      });
      setQuizForm({ title: "", description: "", passingPercentage: 70 });
      setIsCreatingQuiz(false);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText || !activeQuizId) return;
    try {
      await api.post(`/quizzes/${activeQuizId}/questions`, {
        questionText: newQuestionText,
        questionType: questionType,
        points: 10,
        sortOrder: 1
      });
      setNewQuestionText("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-zinc-150 dark:bg-zinc-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Create quiz layout toggle */}
      <div className="flex justify-between items-center select-none">
        <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-widest">Active Quizzes</h3>
        <Button 
          onClick={() => setIsCreatingQuiz(!isCreatingQuiz)}
          className="bg-blue-600 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> {isCreatingQuiz ? "Cancel" : "Add Quiz"}
        </Button>
      </div>

      {isCreatingQuiz && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850/80 shadow-sm max-w-xl space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-650">Quiz Title</label>
            <input 
              type="text"
              value={quizForm.title}
              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs"
              placeholder="Module 1 assessment..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-650">Description</label>
            <input 
              type="text"
              value={quizForm.description}
              onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs"
              placeholder="Test understanding of connection pool limits..."
            />
          </div>
          <Button 
            onClick={handleCreateQuiz}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl"
          >
            Create Quiz
          </Button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-zinc-200 bg-white dark:bg-zinc-900 select-none">
          <HelpCircle className="h-10 w-10 text-zinc-350 dark:text-zinc-650 mx-auto mb-3" />
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No quizzes configured yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz: any) => (
            <div key={quiz.id} className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850/80 bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Passing target {quiz.passingPercentage ?? 70}%</span>
                <h4 className="text-sm font-bold text-zinc-950 dark:text-white mt-1">{quiz.title}</h4>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2 font-medium leading-relaxed">{quiz.description || "Assessment module checks verification metrics."}</p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{quiz.attemptsCount ?? 0} attempts logged</span>
                <button 
                  onClick={() => setActiveQuizId(activeQuizId === quiz.id ? null : quiz.id)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Configure Questions <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {activeQuizId === quiz.id && (
                <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-855 space-y-4">
                  <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block">Add Quiz Question</span>
                  
                  <div className="space-y-3">
                    <input 
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g. What is the default port of PostgreSQL?"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="TEXT">Short Text</option>
                      </select>
                      <button 
                        onClick={handleAddQuestion}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                      >
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CERTIFICATES VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CertificatesView({ data, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-zinc-150 dark:bg-zinc-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {items.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm select-none">
          <Award className="h-10 w-10 text-zinc-350 dark:text-zinc-650 mx-auto mb-3" />
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">No certificates generated by students yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <table className="w-full border-collapse text-left text-xs sm:text-sm text-zinc-650 dark:text-zinc-350">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-800">
                <th className="pb-4 font-bold text-zinc-900 dark:text-white">Student</th>
                <th className="pb-4 font-bold text-zinc-900 dark:text-white">Pathway Title</th>
                <th className="pb-4 font-bold text-zinc-900 dark:text-white">Issued Date</th>
                <th className="pb-4 font-bold text-zinc-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium">
              {items.map((cert: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-200">{cert.studentName}</td>
                  <td className="py-4 text-zinc-550 dark:text-zinc-400">{cert.courseTitle}</td>
                  <td className="py-4 text-zinc-450 dark:text-zinc-500">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ✓ Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DETAILED STUDIO ANALYTICS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsView({ data, isLoading }: any) {
  if (isLoading) {
    return <div className="h-64 bg-zinc-150 dark:bg-zinc-800 rounded-3xl animate-pulse" />;
  }

  // Draw a custom gorgeous SVG analytics area chart using stats!
  const enrollmentPoints = [20, 45, 28, 60, 50, 75, 95];
  const chartHeight = 120;
  const chartWidth = 500;
  const stepX = chartWidth / (enrollmentPoints.length - 1);
  const maxVal = Math.max(...enrollmentPoints);
  const minVal = Math.min(...enrollmentPoints);
  const range = maxVal - minVal || 1;

  // Map values to coordinates
  const coords = enrollmentPoints.map((val, idx) => ({
    x: idx * stepX,
    y: chartHeight - ((val - minVal) / range) * (chartHeight - 20) - 10
  }));

  // Build the svg path d attribute
  const pathD = coords.reduce((acc, point, idx) => 
    idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  , "");

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Graphic enrollment stats */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Weekly Enrollments Trend</h3>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold block mt-0.5">Live student conversion analytics mapped across path entries.</p>
          </div>

          <div className="w-full overflow-hidden select-none">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/80" strokeDasharray="4 4" />
              
              {/* Filled Area */}
              <path d={areaD} fill="url(#areaGrad)" />
              
              {/* Stroke Line */}
              <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              
              {/* Target Data Nodes */}
              {coords.map((point, idx) => (
                <circle 
                  key={idx} 
                  cx={point.x} 
                  cy={point.y} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#2563EB" 
                  strokeWidth="2.5" 
                />
              ))}
            </svg>
            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pt-4 select-none">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Pathway performance details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Conversion Stats</h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Completion Target</span>
                <span>{data?.studentAnalytics?.studentsCompleted ?? 0} finished</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ 
                    width: `${
                      data?.studentAnalytics?.totalStudents > 0 
                        ? (data.studentAnalytics.studentsCompleted / data.studentAnalytics.totalStudents) * 100 
                        : 0
                    }%` 
                  }} 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Quiz Pass Rate</span>
                <span>{Math.round(data?.quizzes?.passRate ?? 0)}% passed</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${data?.quizzes?.passRate ?? 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
