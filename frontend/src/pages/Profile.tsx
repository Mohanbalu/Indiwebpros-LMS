import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Award,
  Brain,
  CheckCircle2,
  User,
  Mail,
  Shield,
  BookOpen,
  ExternalLink,
  Calendar,
  Plus,
  Trash2,
  Heart,
  Download,
  Upload,
  CreditCard,
  Play,
  Share2,
  Linkedin,
  Github,
  Globe,
  Sparkles,
  Check,
  Edit2,
  Camera,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  AlertCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { profileService, ProfileUpdateInput } from "@/services/profile.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileListSkeleton,
} from "@/components/profile/ProfileSkeletons";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { ImageUploadModal } from "@/components/profile/ImageUploadModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { XpVaultSection } from "@/components/profile/XpVaultSection";
import { ActivityTimeline } from "@/components/profile/ActivityTimeline";
import { AchievementsBadgeGrid } from "@/components/profile/AchievementsBadgeGrid";
import { CertificatesGrid } from "@/components/profile/CertificatesGrid";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { PaymentHistoryTable } from "@/components/payment/PaymentHistoryTable";
import { InvoicePrintView } from "@/components/payment/InvoicePrintView";
import { useInvoice } from "@/hooks/usePaymentHistory";

type TabType = "overview" | "pathways" | "achievements" | "billing" | "security";

function ProfileContent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Goals Form state
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Invoice Print state for billing
  const [printPaymentId, setPrintPaymentId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: invoiceRes } = useInvoice(printPaymentId);

  // Fetch Profile Data
  const { data, isLoading, error } = useQuery({
    queryKey: ["profileData"],
    queryFn: profileService.getProfileData,
  });

  // Update Profile Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: profileService.updateProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to update profile", err?.message);
    },
  });

  // Wishlist Mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: profileService.toggleWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      toast.success("Wishlist updated!");
    },
  });

  // Pre-calculate Heatmap Calendar Grid
  const calendarGrid = useMemo(() => {
    if (!data?.calendarData) return [];
    const grid = [];
    const today = new Date();
    for (let i = 120; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = data.calendarData[dateStr] || 0;
      grid.push({ dateStr, count });
    }
    return grid;
  }, [data?.calendarData]);

  // Goal handlers
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const currentGoals = data?.goals || [];
    const updatedGoals = [
      ...currentGoals,
      {
        id: Date.now().toString(),
        title: newGoalTitle,
        category: newGoalCategory,
        completed: false,
      },
    ];

    updateSettingsMutation.mutate({ goals: updatedGoals });
    setNewGoalTitle("");
  };

  const handleToggleGoal = (goalId: string) => {
    const currentGoals = data?.goals || [];
    const updatedGoals = currentGoals.map((g: any) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    updateSettingsMutation.mutate({ goals: updatedGoals });
  };

  const handleDeleteGoal = (goalId: string) => {
    const currentGoals = data?.goals || [];
    const updatedGoals = currentGoals.filter((g: any) => g.id !== goalId);
    updateSettingsMutation.mutate({ goals: updatedGoals });
  };

  // Invoice Print trigger
  const handleDownloadInvoice = (paymentId: string) => {
    setPrintPaymentId(paymentId);
  };

  if (invoiceRes?.data && printPaymentId) {
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      if (printWindow && printRef.current) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Invoice ${invoiceRes.data.invoiceNumber}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @media print { @page { size: A4; margin: 20mm; } }
              </style>
            </head>
            <body>${printRef.current.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 300);
      }
      setPrintPaymentId(null);
    }, 100);
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
        <PageHeader title="Student Profile" description="Loading profile features..." />
        <ProfileHeaderSkeleton />
        <ProfileStatsSkeleton />
        <ProfileListSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Unable to load profile</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          There was an error communicating with the LMS backend.
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["profileData"] })}
          className="mt-4"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  const {
    header,
    learningOverview,
    skills,
    roadmapNodes,
    achievements,
    coursesProgress,
    insights,
    profileCompletion,
    goals,
    recentActivities,
    paymentHistory,
    wishlist,
    recommendations,
    calendarData,
  } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">

      {/* Dynamic Profile Header Cover */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm select-none">
        <div
          className="h-48 w-full bg-cover bg-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative"
          style={header.socials.coverUrl && !coverError ? { backgroundImage: `url(${header.socials.coverUrl})` } : undefined}
        >
          {/* Edit Cover Button */}
          <button
            onClick={() => setIsCoverModalOpen(true)}
            className="absolute top-4 right-4 bg-zinc-900/70 hover:bg-zinc-900/90 text-white px-3.5 py-1.5 rounded-full border border-white/20 transition-all backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Camera className="h-3.5 w-3.5" />
            Edit Cover
          </button>
        </div>

        <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-5 -mt-12 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            {/* Avatar with Camera Overlay */}
            <div className="relative group">
              <div className="h-28 w-28 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-md flex items-center justify-center">
                {header.avatarUrl && !avatarError ? (
                  <img
                    src={header.avatarUrl}
                    alt={`${header.firstName} ${header.lastName}`}
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
                )}
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-md transition border-2 border-white dark:border-zinc-900"
                title="Upload Avatar"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {header.firstName} {header.lastName}
                </h2>
                {header.isEmailVerified && (
                  <Badge variant="success" className="text-[9px] py-0.5 px-2 rounded-full font-extrabold tracking-wider">
                    VERIFIED STUDENT
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">
                {header.roleName} &bull; ID: {header.userId.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-zinc-500 mt-1.5 flex items-center justify-center md:justify-start gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Member since {new Date(header.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              size="sm"
              variant="outline"
              className="rounded-xl font-bold flex items-center gap-1.5 border-zinc-300 dark:border-zinc-700"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Account Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Panel */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        {(["overview", "pathways", "achievements", "billing", "security"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all uppercase tracking-wider ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850/60"
            }`}
          >
            {tab === "overview" && "Dashboard Overview"}
            {tab === "pathways" && "Pathways & Goals"}
            {tab === "achievements" && "Achievements & Skills"}
            {tab === "billing" && "Billing & Activity"}
            {tab === "security" && "Security & Devices"}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Learning Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Enrolled", value: learningOverview.coursesEnrolled, icon: <BookOpen className="text-blue-500" />, color: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
                  { label: "Completed", value: learningOverview.coursesCompleted, icon: <CheckCircle2 className="text-emerald-500" />, color: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
                  { label: "Streak", value: `${learningOverview.learningStreak} Days`, icon: <Sparkles className="text-orange-500" />, color: "bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30" },
                  { label: "Hours Learned", value: `${learningOverview.totalLearningHours} hrs`, icon: <Clock className="text-purple-500" />, color: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30" },
                ].map((s, idx) => (
                  <Card key={idx} className={`border ${s.color}`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">{s.label}</span>
                        <p className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{s.value}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-inner shrink-0">
                        {s.icon}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Profile Completion Meter & XP Section Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileCompletionCard
                  percentage={profileCompletion.percentage}
                  missingFields={profileCompletion.missingFields}
                  onOpenEditModal={() => setIsEditModalOpen(true)}
                  onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
                  onOpenCoverModal={() => setIsCoverModalOpen(true)}
                />

                <XpVaultSection
                  currentLevel={learningOverview.currentLevel}
                  xpPoints={learningOverview.xpPoints}
                  xpProgressPct={learningOverview.xpProgressPct}
                  leaderboardRank={learningOverview.leaderboardRank}
                  coursesEnrolled={learningOverview.coursesEnrolled}
                  lessonsCompleted={learningOverview.coursesCompleted * 5 || 5}
                  quizzesPassed={learningOverview.quizzesAttempted || 0}
                />
              </div>

              {/* Heatmap & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar heatmap */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                      Learning Calendar Contribution Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                      <span>Daily Study Consistency</span>
                      <span>Total Active Days: {Object.keys(calendarData).length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-1.5 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 justify-center">
                      {calendarGrid.map((day, idx) => (
                        <div
                          key={idx}
                          title={`${day.dateStr}: ${day.count} active entries`}
                          className={`h-3 w-3 rounded-xs transition-colors cursor-pointer ${
                            day.count === 0
                              ? "bg-zinc-150 dark:bg-zinc-900 hover:bg-zinc-200"
                              : day.count === 1
                              ? "bg-emerald-200 dark:bg-emerald-950/40 border border-emerald-300/30"
                              : day.count === 2
                              ? "bg-emerald-400 dark:bg-emerald-800"
                              : "bg-emerald-600 dark:bg-emerald-600"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI Learning Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.map((ins: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100/40 dark:border-purple-900/20 text-xs font-semibold text-purple-950 dark:text-purple-300 leading-relaxed"
                      >
                        {ins}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Catalog */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Recommended Course Pathways
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map((course: any) => (
                    <Card key={course.id} className="group overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300">
                      <div className="h-32 bg-zinc-100 dark:bg-zinc-950/40 relative overflow-hidden flex items-center justify-center border-b border-zinc-200 dark:border-zinc-850">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">{course.title}</h4>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Instructor: {course.instructorName}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                            {course.discountPrice ? `₹${course.discountPrice}` : `₹${course.price}`}
                          </span>
                          <Button size="xs" variant="primary" className="rounded-lg font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 h-8">
                            View Pathway
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATHWAYS & GOALS */}
          {activeTab === "pathways" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Enrolled Course Pathways
                </h4>
                {coursesProgress.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-8 w-8 text-zinc-400" />}
                    title="No pathways enrolled yet"
                    description="Browse our course catalog to sign up for classes and begin your learning journey."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {coursesProgress.map((course: any) => (
                      <Card key={course.id} className="group overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300">
                        <CardContent className="p-5 flex gap-4 items-start">
                          <div className="h-20 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-950/40 relative overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-center">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5 py-0.5">
                            <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-150 line-clamp-1">{course.title}</h4>
                            <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide">Instructor: {course.instructorName} &bull; {course.totalLessons} Lessons</p>
                            <div className="w-full max-w-xs space-y-1 pt-1.5">
                              <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-500">
                                <span>{course.progress}% completed</span>
                                <span className="uppercase text-[9px] tracking-wide text-zinc-450">Est: {course.estimatedCompletion}</span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                              </div>
                            </div>
                            <div className="pt-3 flex items-center justify-end">
                              <Button size="xs" variant="primary" className="rounded-xl text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 px-4 py-2 h-9 shadow-sm">
                                <Play className="h-3 w-3 fill-current" />
                                Resume Learning
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals Wizard */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Weekly / Monthly Study Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleAddGoal} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-zinc-50/50 dark:bg-zinc-950/25 border border-zinc-200 dark:border-zinc-850/50 p-4 rounded-2xl">
                    <div className="md:col-span-2">
                      <Input
                        id="new-goal"
                        label="New Goal Title"
                        placeholder="e.g. Finish 3 lessons this week"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Period
                      </label>
                      <select
                        value={newGoalCategory}
                        onChange={(e) => setNewGoalCategory(e.target.value as any)}
                        className="w-full text-xs font-semibold h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-zinc-200"
                      >
                        <option value="daily">Daily Goal</option>
                        <option value="weekly">Weekly Goal</option>
                        <option value="monthly">Monthly Goal</option>
                      </select>
                    </div>
                    <Button type="submit" size="sm" className="rounded-xl h-10 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-blue-600 text-white">
                      <Plus className="h-4 w-4" />
                      Add Goal
                    </Button>
                  </form>

                  <div className="space-y-2">
                    {goals.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4 font-semibold">No study goals added yet.</p>
                    ) : (
                      goals.map((g: any) => (
                        <div key={g.id} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleGoal(g.id)}
                              className={`h-5 w-5 rounded-md flex items-center justify-center transition border ${
                                g.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-300 dark:border-zinc-700"
                              }`}
                            >
                              {g.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </button>
                            <div>
                              <span className={`text-xs font-bold ${g.completed ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                                {g.title}
                              </span>
                              <span className="block text-[8px] font-extrabold uppercase text-zinc-400">{g.category}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteGoal(g.id)} className="text-zinc-400 hover:text-red-500 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS & SKILLS */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <AchievementsBadgeGrid achievements={achievements} />

              <CertificatesGrid
                certificates={data.certificates || []}
                onDownloadPdf={(cert) => toast.info("Downloading PDF...", cert.courseTitle)}
                onShareLinkedin={(cert) => toast.success("LinkedIn Share link copied!")}
              />
            </div>
          )}

          {/* TAB 4: BILLING & ACTIVITY */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <PaymentHistoryTable
                payments={paymentHistory.map((p: any) => ({
                  id: p.id,
                  courseId: p.courseId || "",
                  provider: "RAZORPAY",
                  transactionId: p.invoiceNumber,
                  amount: p.amount + p.discount,
                  discount: p.discount,
                  tax: p.tax || 0,
                  finalAmount: p.amount,
                  currency: "INR",
                  status: p.status,
                  paymentMethod: "RAZORPAY",
                  paidAt: p.date,
                  createdAt: p.date,
                  updatedAt: p.date,
                  metadata: null,
                  course: {
                    id: p.courseId || "",
                    title: p.courseTitle,
                    slug: "",
                    instructor: { id: "", firstName: "", lastName: "" },
                  },
                }))}
                total={paymentHistory.length}
                page={1}
                totalPages={1}
                isLoading={false}
                onPageChange={() => {}}
                onDownloadInvoice={handleDownloadInvoice}
              />

              <ActivityTimeline activities={recentActivities} />
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === "security" && (
            <SecurityTab
              sessions={[]}
              onChangePassword={(data) => profileService.changePassword(data)}
              onRevokeSession={(id) => profileService.revokeSession(id)}
              onSuccessToast={(msg) => toast.success(msg)}
              onErrorToast={(msg) => toast.error(msg)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Upload Avatar Modal */}
      <ImageUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Upload Profile Avatar"
        uploadType="avatar"
        currentUrl={header.avatarUrl}
        onUpload={(file, onProgress) => profileService.uploadAvatar(file, onProgress)}
        onSuccess={(newUrl) => {
          setAvatarError(false);
          queryClient.invalidateQueries({ queryKey: ["profileData"] });
          toast.success("Avatar updated successfully!");
        }}
      />

      {/* Upload Cover Modal */}
      <ImageUploadModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        title="Upload Profile Cover Photo"
        uploadType="cover"
        currentUrl={header.socials.coverUrl}
        onUpload={(file, onProgress) => profileService.uploadCover(file, onProgress)}
        onSuccess={(newUrl) => {
          setCoverError(false);
          queryClient.invalidateQueries({ queryKey: ["profileData"] });
          toast.success("Cover photo updated successfully!");
        }}
      />

      {/* Edit Profile Parameters Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialValues={{
          firstName: header.firstName,
          lastName: header.lastName,
          email: header.email,
          phone: header.phone,
          bio: header.bio,
          college: header.college,
          github: header.socials.github,
          linkedin: header.socials.linkedin,
          portfolio: header.socials.portfolio,
          country: header.socials.country,
          city: header.socials.city,
          state: header.socials.state,
          timezone: header.socials.timezone,
          language: header.socials.language,
          gender: header.socials.gender,
          dateOfBirth: header.socials.dateOfBirth,
        }}
        onSave={async (updatedData) => {
          await updateSettingsMutation.mutateAsync(updatedData);
        }}
      />

      {/* Hidden Invoice print ref zone */}
      {invoiceRes?.data && (
        <div className="hidden">
          <InvoicePrintView ref={printRef} invoice={invoiceRes.data} />
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <ToastProvider>
      <ProfileContent />
    </ToastProvider>
  );
}
