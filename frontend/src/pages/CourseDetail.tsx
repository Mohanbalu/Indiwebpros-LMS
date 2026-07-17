import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, Star, CheckCircle, ArrowLeft, ShieldCheck, Check, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/context/AuthContext";
import { usePayment } from "@/hooks/usePayment";

interface CourseDetailData {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  price: number;
  duration: string;
  rating: number;
  studentsCount: number;
  category: { name: string };
  instructor: { firstName: string; lastName: string; bio?: string };
  requirements?: string[];
  outcomes?: string[];
  modules?: {
    id: string;
    title: string;
    description?: string;
    lessons: { id: string; title: string; duration: number; isPreview?: boolean }[];
  }[];
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollFree, paymentState } = usePayment();
  const [openModuleIdx, setOpenModuleIdx] = useState<number | null>(0);

  // Fetching user's current active enrollments
  const { data: myCourses } = useQuery({
    queryKey: ["myCourses"],
    queryFn: async () => {
      if (!user) return null;
      const res = await api.get("/my/courses");
      return res.data;
    },
    enabled: !!user,
  });

  // Fetching course details via React Query
  const { data: courseRes, isLoading } = useQuery({
    queryKey: ["courseDetail", slug],
    queryFn: async () => {
      const res = await api.get(`/courses/slug/${slug}`);
      return res.data;
    },
  });

  const course: CourseDetailData | null = courseRes?.success && courseRes.data
    ? courseRes.data
    : null;

  const isEnrolled = myCourses?.data?.some(
    (e: { course?: { id?: string } }) => e.course?.id === course?.id
  ) || false;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto mb-6" />
        <div className="h-12 w-96 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto mb-4" />
        <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">Course Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          The course matching path "{slug}" could not be located in our learning catalog.
        </p>
        <Link to={ROUTES.courses}>
          <Button>Back to Course Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Link to={ROUTES.courses} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to pathways
        </Link>

        {/* Hero split section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2">
            <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
              {course.category.name}
            </span>
            <h1 className="course-title text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl lg:text-5xl leading-tight">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              {course.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-6 items-center text-sm text-zinc-500 dark:text-zinc-400 font-medium border-y border-zinc-200/50 dark:border-zinc-805 py-4">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> {course.studentsCount} Enrolled
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> {course.rating} Rating
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" /> {course.level} Level
              </span>
            </div>
          </div>

          {/* Pricing Enrollment Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Pathway Access Fee</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </span>
                <span className="text-sm text-zinc-400 dark:text-zinc-500">One-time payment</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Full lifetime access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> 1-on-1 industry code feedback
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Interactive sandbox environments
                </li>
              </ul>
            </div>
            <div className="mt-8">
              {isEnrolled ? (
                <Link to={ROUTES.player}>
                  <Button className="w-full start-learning-btn" size="lg">Start Learning</Button>
                </Link>
              ) : course.price === 0 ? (
                <Button
                  onClick={async () => {
                    if (!user) {
                      navigate(`${ROUTES.login}?redirect=/courses/${slug}`);
                      return;
                    }
                    try {
                      await enrollFree({ courseId: course.id });
                      navigate(ROUTES.player);
                    } catch (error) {
                      console.error("[CourseDetail] Free enrollment failed:", error);
                    }
                  }}
                  className="w-full enroll-btn"
                  size="lg"
                  disabled={paymentState === "payment_processing"}
                >
                  {paymentState === "payment_processing" ? "Enrolling..." : "Enroll Now"}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!user) {
                      navigate(`${ROUTES.login}?redirect=/courses/${slug}`);
                      return;
                    }
                    navigate(`/payments/checkout?courseId=${course.id}`);
                  }}
                  className="w-full enroll-btn"
                  size="lg"
                >
                  Buy Now
                </Button>
              )}
              <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                30-day money-back guarantee policy applies
              </p>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">What you will learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.outcomes.map((o, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum collapsible syllabus */}
            {course.modules && course.modules.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Syllabus Curriculum</h2>
                <div className="space-y-4">
                  {course.modules.map((m, idx) => (
                    <div
                      key={idx}
                      className="border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenModuleIdx(openModuleIdx === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-50/50 dark:bg-zinc-900/10 focus:outline-none text-sm"
                      >
                        <span>{m.title}</span>
                        <span className="text-xs text-zinc-400 font-semibold">
                          {m.lessons.length} lessons
                        </span>
                      </button>
                      {openModuleIdx === idx && (
                        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-5 space-y-3">
                          {m.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100/50 dark:border-zinc-850/50 last:border-0">
                              <div className="flex items-center gap-2">
                                {lesson.isPreview ? (
                                  <Play className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                                )}
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {lesson.isPreview && (
                                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-extrabold px-2 py-0.5 rounded">
                                    Preview
                                  </span>
                                )}
                                <span className="text-zinc-400 font-medium">{lesson.duration}m</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Requirements</h2>
                <ul className="list-disc list-inside space-y-2 text-sm text-zinc-650 dark:text-zinc-400 font-medium">
                  {course.requirements.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar instructor card */}
          <div>
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">Pathway Instructor</h3>
              <div className="flex gap-4 items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {course.instructor.firstName[0]}{course.instructor.lastName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
                    {course.instructor.firstName} {course.instructor.lastName}
                  </h4>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500">LMS Lead Engineer</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                {course.instructor.bio || "Industry software practitioner bringing production expertise directly to LMS pipelines."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
