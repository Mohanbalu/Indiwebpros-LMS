import { useState, useMemo } from "react";
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
  AlertCircle
} from "lucide-react";
import { profileService } from "@/services/profile.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileListSkeleton
} from "@/components/profile/ProfileSkeletons";

type TabType = "overview" | "pathways" | "achievements" | "billing" | "settings";

export default function Profile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Query profile data
  const { data, isLoading, error } = useQuery({
    queryKey: ["profileData"],
    queryFn: profileService.getProfileData,
  });

  // Edit settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: profileService.updateProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      setIsEditing(false);
    },
  });

  // Toggle wishlist course
  const toggleWishlistMutation = useMutation({
    mutationFn: profileService.toggleWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
  });

  // Local Form state for edit account info
  const [editForm, setEditForm] = useState<any>({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
    college: "",
    github: "",
    linkedin: "",
    portfolio: "",
    website: "",
    coverUrl: "",
    country: "",
    state: "",
    city: "",
    timezone: "",
    language: "",
    gender: "",
    dateOfBirth: "",
  });

  const handleEditClick = () => {
    if (data?.header) {
      setEditForm({
        firstName: data.header.firstName,
        lastName: data.header.lastName,
        phone: data.header.phone,
        bio: data.header.bio,
        college: data.header.college,
        github: data.header.socials.github,
        linkedin: data.header.socials.linkedin,
        portfolio: data.header.socials.portfolio,
        website: data.header.socials.website,
        coverUrl: data.header.socials.coverUrl,
        country: data.header.socials.country,
        state: data.header.socials.state,
        city: data.header.socials.city,
        timezone: data.header.socials.timezone,
        language: data.header.socials.language,
        gender: data.header.socials.gender,
        dateOfBirth: data.header.socials.dateOfBirth,
      });
    }
    setIsEditing(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(editForm);
  };

  // Goals CRUD handlers using existing metadata update mutation
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

  // Toggle notification preferences
  const handleToggleNotification = (prefKey: string) => {
    const currentPrefs = data?.notificationPreferences || {};
    const updatedPrefs = {
      ...currentPrefs,
      [prefKey]: !currentPrefs[prefKey],
    };
    updateSettingsMutation.mutate({ notificationPreferences: updatedPrefs });
  };

  // Pre-calculate heatmap attributes
  const calendarGrid = useMemo(() => {
    if (!data?.calendarData) return [];
    const grid = [];
    const today = new Date();
    // 120 days view (roughly 17 weeks)
    for (let i = 120; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = data.calendarData[dateStr] || 0;
      grid.push({ dateStr, count });
    }
    return grid;
  }, [data?.calendarData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">There was an error communicating with the LMS backend.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["profileData"] })} className="mt-4">
          Retry Connection
        </Button>
      </div>
    );
  }

  const { header, learningOverview, weeklyHours, skills, roadmapNodes, achievements, coursesProgress, insights, profileCompletion, goals, recentActivities, paymentHistory, wishlist, recommendations, notificationPreferences, calendarData } = data;

  const coverBannerStyle = header.socials.coverUrl 
    ? { backgroundImage: `url(${header.socials.coverUrl})` }
    : { bgGradient: "linear-gradient(135deg, #4f46e5, #06b6d4)" };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      {/* Dynamic Profile Header Cover */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm select-none">
        <div 
          className="h-48 w-full bg-cover bg-center bg-gradient-to-r from-blue-600 to-indigo-700 relative"
          style={header.socials.coverUrl ? { backgroundImage: `url(${header.socials.coverUrl})` } : undefined}
        >
          {/* Change cover button overlay */}
          <button 
            onClick={() => {
              const url = prompt("Enter cover image S3/HTTPS URL:", header.socials.coverUrl);
              if (url !== null) updateSettingsMutation.mutate({ coverUrl: url });
            }}
            className="absolute top-4 right-4 bg-zinc-900/60 hover:bg-zinc-900/80 text-white p-2 rounded-full border border-white/20 transition-all backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold"
          >
            <Camera className="h-3.5 w-3.5" />
            Edit Cover
          </button>
        </div>
        <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-5 -mt-12 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-md flex items-center justify-center">
                {header.avatarUrl ? (
                  <img src={header.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
                )}
              </div>
              <button 
                onClick={() => {
                  const url = prompt("Enter avatar image S3/HTTPS URL:", header.avatarUrl);
                  if (url !== null) updateSettingsMutation.mutate({ avatarUrl: url });
                }}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 shadow-sm transition border border-white dark:border-zinc-900"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{header.firstName} {header.lastName}</h2>
                {header.isEmailVerified && (
                  <Badge variant="success" className="text-[9px] py-0.5 px-2 rounded-full font-extrabold tracking-wider">
                    VERIFIED STUDENT
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">{header.roleName} &bull; ID: {header.userId.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-zinc-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Member since {new Date(header.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleEditClick} size="sm" variant="outline" className="rounded-xl font-bold flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" />
              Edit Account settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        {(["overview", "pathways", "achievements", "billing", "settings"] as TabType[]).map((tab) => (
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
            {tab === "settings" && "Account & Privacy"}
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
          {/* Tab 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Learning stats overview grid */}
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

              {/* XP Level progress meter */}
              <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        LEVEL {learningOverview.currentLevel}
                      </Badge>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">&bull; XP Rank #{learningOverview.leaderboardRank}</span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-2">Dynamic XP Progress Vault</h3>
                    <p className="text-xs text-zinc-500 font-medium">Earn +100 XP per lesson completion and +250 XP per passed quiz to rise on the leaderboard.</p>
                  </div>
                  <div className="w-full md:w-80 shrink-0 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                      <span>{learningOverview.xpPoints} Total XP</span>
                      <span>{learningOverview.xpProgressPct}% toward Level {learningOverview.currentLevel + 1}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/50 dark:border-zinc-800">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${learningOverview.xpProgressPct}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap and insights row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Heatmap calendar */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Learning Calendar contribution map</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                      <span>Daily Study Consistency</span>
                      <span>Total Studied Days: {Object.keys(calendarData).length}</span>
                    </div>
                    {/* GitHub contribution blocks map */}
                    <div className="flex flex-wrap gap-1 md:gap-1.5 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 justify-center">
                      {calendarGrid.map((day, idx) => (
                        <div
                          key={idx}
                          title={`${day.dateStr}: ${day.count} active entries`}
                          className={`h-3 w-3 rounded-xs transition-colors cursor-pointer ${
                            day.count === 0 ? "bg-zinc-150 dark:bg-zinc-850 hover:bg-zinc-200" :
                            day.count === 1 ? "bg-emerald-200 dark:bg-emerald-950/40 border border-emerald-300/30" :
                            day.count === 2 ? "bg-emerald-400 dark:bg-emerald-800" :
                            "bg-emerald-600 dark:bg-emerald-600"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 tracking-wide uppercase">
                      <span>Less</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2.5 w-2.5 rounded bg-zinc-150 dark:bg-zinc-850" />
                        <div className="h-2.5 w-2.5 rounded bg-emerald-200" />
                        <div className="h-2.5 w-2.5 rounded bg-emerald-400" />
                        <div className="h-2.5 w-2.5 rounded bg-emerald-600" />
                      </div>
                      <span>More</span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI Learning Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.map((ins: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/30 dark:border-purple-900/10 text-xs font-semibold text-purple-950 dark:text-purple-300 leading-relaxed">
                        {ins}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Catalog grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Recommended Course pathways for you</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map((course: any) => (
                    <Card key={course.id} className="group overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300 hover:shadow-md">
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

          {/* Tab 2: PATHWAYS & GOALS */}
          {activeTab === "pathways" && (
            <div className="space-y-6">
              {/* Enrolled Courses Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Courses currently in progress</h4>
                {coursesProgress.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-8 w-8 text-zinc-400" />}
                    title="No pathways enrolled yet"
                    description="Browse our syllabus catalog to sign up for classes and begin your learning journey."
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
                                <span className="uppercase text-[9px] tracking-wide text-zinc-450">Est. completion: {course.estimatedCompletion}</span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                              </div>
                            </div>
                            <div className="pt-3 flex items-center justify-end">
                              <Button size="xs" variant="primary" className="rounded-xl text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 px-4 py-2 h-9 shadow-sm hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]">
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

              {/* Dynamic Roadmap sequence */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Dynamic Learning Roadmap Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 overflow-x-auto scrollbar-none">
                    {roadmapNodes.map((node: any, idx: number) => (
                      <div key={node.id} className="flex items-center gap-2 flex-1 w-full justify-between md:justify-center">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            node.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" :
                            node.status === "CURRENT" ? "bg-blue-100 dark:bg-blue-950 text-blue-600 border border-blue-300/30 animate-pulse" :
                            "bg-zinc-100 dark:bg-zinc-850 text-zinc-400"
                          }`}>
                            {node.status === "COMPLETED" ? <Check className="h-3.5 w-3.5" /> : node.id}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{node.title}</span>
                            <span className="block text-[9px] font-extrabold tracking-widest text-zinc-450 uppercase">{node.status}</span>
                          </div>
                        </div>
                        {idx < roadmapNodes.length - 1 && (
                          <div className="hidden md:block h-0.5 bg-zinc-200 dark:bg-zinc-800 w-10 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Goals module editing settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Weekly / Monthly Study Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleAddGoal} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-zinc-50/50 dark:bg-zinc-950/25 border border-zinc-200 dark:border-zinc-850/50 p-4 rounded-2xl">
                    <div className="md:col-span-2">
                      <Input
                        id="new-goal"
                        label="New Goal Title"
                        placeholder="e.g. Read 5 articles, watch trailer"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Goal Period</label>
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

                  {/* Goal Listing */}
                  <div className="space-y-3">
                    {goals.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4 font-semibold">No learning goals defined yet. Use the wizard above to add one!</p>
                    ) : (
                      goals.map((g: any) => (
                        <div key={g.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10 transition">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleGoal(g.id)}
                              className={`h-5 w-5 rounded-md flex items-center justify-center transition border ${
                                g.completed 
                                  ? "bg-emerald-600 border-emerald-600 text-white" 
                                  : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                              }`}
                            >
                              {g.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </button>
                            <div>
                              <span className={`text-xs font-bold ${g.completed ? "line-through text-zinc-450 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                                {g.title}
                              </span>
                              <span className="block text-[8px] font-extrabold uppercase tracking-widest text-zinc-450 mt-0.5">{g.category}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteGoal(g.id)} className="text-zinc-400 hover:text-red-500 p-1 transition">
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

          {/* Tab 3: ACHIEVEMENTS & SKILLS */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              {/* Badges system */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Unlocked achievements and medals</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {achievements.map((badge: any) => (
                    <Card key={badge.id} className={`border text-center overflow-hidden hover:-translate-y-1 transition duration-300 ${
                      badge.unlocked 
                        ? "bg-amber-50/10 dark:bg-amber-950/5 border-amber-200/50 dark:border-amber-900/30" 
                        : "bg-zinc-50/20 dark:bg-zinc-950/20 border-zinc-150 dark:border-zinc-850 opacity-60"
                    }`}>
                      <CardContent className="p-4 flex flex-col items-center justify-between h-36">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          badge.unlocked ? "bg-amber-100 dark:bg-amber-950 text-amber-500" : "bg-zinc-100 dark:bg-zinc-850 text-zinc-400"
                        }`}>
                          <Award className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5 mt-2">
                          <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 line-clamp-1">{badge.name}</h4>
                          <span className="block text-[8px] font-medium text-zinc-450 dark:text-zinc-500 line-clamp-2 leading-snug">{badge.description}</span>
                        </div>
                        <div className="w-full mt-2">
                          <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${badge.unlocked ? "bg-amber-500" : "bg-zinc-400"}`} style={{ width: `${badge.progress}%` }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Skills Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Dynamic skills mapped from course progression</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {skills.length === 0 ? (
                    <div className="md:col-span-3">
                      <EmptyState
                        icon={<Brain className="h-8 w-8 text-zinc-400" />}
                        title="No skills generated yet"
                        description="Complete lesson courses to dynamically map coding technologies onto your profile."
                      />
                    </div>
                  ) : (
                    skills.map((skill: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={skill.level === "Advanced" ? "success" : skill.level === "Intermediate" ? "primary" : "secondary"} className="text-[9px] font-bold py-0.5 px-2 tracking-wider rounded-md uppercase">
                              {skill.level}
                            </Badge>
                            <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-450 uppercase">{skill.name}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                              <span>Skill progress</span>
                              <span>{skill.completion}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${skill.completion}%` }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Certificates Verification list */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Earned Course Certificates</h4>
                {certificates.length === 0 ? (
                  <EmptyState
                    icon={<Award className="h-8 w-8 text-zinc-400" />}
                    title="No certificates earned yet"
                    description="Successfully finish 100% of any enrolled course syllabus to generate certificates."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert: any) => (
                      <Card key={cert.id} className="group overflow-hidden border border-amber-200/40 dark:border-amber-900/20 hover:border-amber-300 transition duration-300">
                        <CardContent className="p-5 flex gap-4 items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{cert.courseTitle}</h4>
                            <p className="text-[10px] font-extrabold tracking-widest text-amber-600 dark:text-amber-500 uppercase">NO: {cert.certificateNumber}</p>
                            <p className="text-[10px] text-zinc-450 mt-1">Issued at {new Date(cert.issuedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button size="xs" variant="outline" className="rounded-xl flex items-center gap-1 h-9 px-3 border-amber-200 hover:border-amber-300 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </Button>
                            <button
                              onClick={() => alert(`Share certificate to LinkedIn: NO: ${cert.certificateNumber}`)}
                              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition"
                              title="Share on LinkedIn"
                            >
                              <Linkedin className="h-4 w-4 text-blue-600" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: BILLING & ACTIVITY */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Payment history invoice list */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Invoice & Payment Transactions</h4>
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/40 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-6 py-4">Pathway / Course</th>
                          <th className="px-6 py-4">Invoice No</th>
                          <th className="px-6 py-4">Paid Date</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                          <th className="px-6 py-4 text-right">Discount</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                        {paymentHistory.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-xs font-bold text-zinc-500">No payment transaction records exist.</td>
                          </tr>
                        ) : (
                          paymentHistory.map((pay: any) => (
                            <tr key={pay.id} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                              <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{pay.courseTitle}</td>
                              <td className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wide text-zinc-500">{pay.invoiceNumber}</td>
                              <td className="px-6 py-4 text-zinc-500">{new Date(pay.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right font-extrabold text-zinc-950 dark:text-white">₹{pay.amount}</td>
                              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-500 font-bold">-₹{pay.discount}</td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={pay.status === "SUCCESS" ? "success" : pay.status === "PENDING" ? "secondary" : "danger"} className="text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider">
                                  {pay.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => alert(`Downloading Invoice: ${pay.invoiceNumber}`)}
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850/50 transition inline-flex items-center"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Wishlist grid list */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Personal Wishlist Catalog</h4>
                {wishlist.length === 0 ? (
                  <EmptyState
                    icon={<Heart className="h-8 w-8 text-zinc-400" />}
                    title="Your wishlist is empty"
                    description="Save course pathways you want to purchase or enroll in later, and they will show up here."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {wishlist.map((course: any) => (
                      <Card key={course.id} className="group overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300">
                        <div className="h-32 bg-zinc-100 dark:bg-zinc-950/40 relative overflow-hidden flex items-center justify-center border-b border-zinc-200 dark:border-zinc-850">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                          )}
                          <button
                            onClick={() => toggleWishlistMutation.mutate(course.id)}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-900/85 text-red-500 transition border border-white/10"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">{course.title}</h4>
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Instructor: {course.instructorName}</p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                              {course.discountPrice ? `₹${course.discountPrice}` : `₹${course.price}`}
                            </span>
                            <Button size="xs" variant="primary" className="rounded-lg font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 h-8">
                              Enroll Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent activity timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Recent Activity History Timeline</h4>
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-xs text-zinc-550 dark:text-zinc-450 text-center font-semibold">No recent activity logged yet.</p>
                  ) : (
                    recentActivities.map((act: any, idx: number) => (
                      <div key={act.id} className="flex gap-4 items-start select-none">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                            <span>{act.title}</span>
                            <span className="text-[10px] font-extrabold tracking-wide text-zinc-450 uppercase">{new Date(act.date).toLocaleDateString()}</span>
                          </h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">{act.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: SETTINGS & PRIVACY */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column Settings Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Personal Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="set-fname"
                        label="First Name"
                        value={isEditing ? editForm.firstName : header.firstName}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      />
                      <Input
                        id="set-lname"
                        label="Last Name"
                        value={isEditing ? editForm.lastName : header.lastName}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="set-email"
                        label="Email Address"
                        value={header.email}
                        disabled
                      />
                      <Input
                        id="set-phone"
                        label="Phone Number"
                        value={isEditing ? editForm.phone : header.phone}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="set-college"
                        label="College Name"
                        value={isEditing ? editForm.college : header.college}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                      />
                      <Input
                        id="set-dob"
                        label="Date of Birth"
                        type="date"
                        value={isEditing ? editForm.dateOfBirth : header.socials.dateOfBirth}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        id="set-country"
                        label="Country"
                        value={isEditing ? editForm.country : header.socials.country}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      />
                      <Input
                        id="set-state"
                        label="State / Region"
                        value={isEditing ? editForm.state : header.socials.state}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      />
                      <Input
                        id="set-city"
                        label="City"
                        value={isEditing ? editForm.city : header.socials.city}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        id="set-tz"
                        label="Timezone"
                        value={isEditing ? editForm.timezone : header.socials.timezone}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                      />
                      <Input
                        id="set-lang"
                        label="Language"
                        value={isEditing ? editForm.language : header.socials.language}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Gender</label>
                        <select
                          disabled={!isEditing}
                          value={isEditing ? editForm.gender : header.socials.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full text-xs font-semibold h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-zinc-200"
                        >
                          <option value="">Unspecified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Bio Biography</label>
                      <textarea
                        disabled={!isEditing}
                        rows={3}
                        value={isEditing ? editForm.bio : header.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-zinc-200"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="set-gh"
                        label="GitHub Profile Url"
                        value={isEditing ? editForm.github : header.socials.github}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                      />
                      <Input
                        id="set-li"
                        label="LinkedIn Profile Url"
                        value={isEditing ? editForm.linkedin : header.socials.linkedin}
                        disabled={!isEditing}
                        onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end pt-4 gap-3 select-none">
                      {isEditing ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl font-bold uppercase tracking-wider text-xs">
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs bg-blue-600 text-white">
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="primary" size="sm" onClick={handleEditClick} className="rounded-xl font-bold uppercase tracking-wider text-xs bg-blue-600 text-white">
                          Edit Profile Parameters
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Right Column settings details: Profile Completion, Security logs, Preference toggles */}
              <div className="space-y-6">
                {/* Profile Completion Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-50 tracking-wider">Profile Completion meter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                      <span>Completion Score</span>
                      <span>{profileCompletion.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${profileCompletion.percentage}%` }} />
                    </div>
                    {profileCompletion.missingFields.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <span className="block text-[10px] font-extrabold uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">Missing parameters:</span>
                        {profileCompletion.missingFields.map((field: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                            <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
                            <span>Add {field}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications preferences toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-50 tracking-wider">Notification Alert Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "courseUpdates", label: "Course updates & news" },
                      { key: "assignmentAlerts", label: "Assignment grading comments" },
                      { key: "emailNotifications", label: "Email newsletter notifications" },
                      { key: "smsNotifications", label: "SMS verification notices" },
                      { key: "marketingEmails", label: "Special marketing coupon offers" },
                      { key: "weeklyReport", label: "Weekly performance metrics report" },
                    ].map((pref) => {
                      const isActive = notificationPreferences[pref.key];
                      return (
                        <div key={pref.key} className="flex items-center justify-between py-1.5 select-none">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{pref.label}</span>
                          <button
                            onClick={() => handleToggleNotification(pref.key)}
                            className="text-zinc-400 hover:text-zinc-600 focus:outline-none transition-all"
                          >
                            {isActive ? (
                              <ToggleRight className="h-7 w-7 text-blue-600 fill-blue-600/10" />
                            ) : (
                              <ToggleLeft className="h-7 w-7 text-zinc-300 dark:text-zinc-700" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
