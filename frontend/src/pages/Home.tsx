

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Star, ArrowRight, BookOpen, Users, Award, ShieldCheck, Brain, Cloud, BarChart2, Sparkles, Layers, MessageSquare, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";

export default function Home() {
  const [stats, setStats] = useState({
    studentsCount: 15420,
    coursesCount: 120,
    mentorsCount: 45,
    placementRate: 94.5,
  });

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const categories = [
    { name: "Full Stack Development", count: 18, color: "from-blue-500 to-indigo-600", icon: <BookOpen className="h-5 w-5 text-blue-500" /> },
    { name: "AI & Machine Learning", count: 12, color: "from-purple-500 to-pink-500", icon: <Brain className="h-5 w-5 text-purple-500" /> },
    { name: "Cloud Engineering & IaC", count: 14, color: "from-cyan-500 to-blue-500", icon: <Cloud className="h-5 w-5 text-cyan-500" /> },
    { name: "Cyber Security", count: 8, color: "from-teal-500 to-emerald-500", icon: <ShieldCheck className="h-5 w-5 text-teal-500" /> },
    { name: "Data Science & Python", count: 10, color: "from-amber-500 to-orange-500", icon: <BarChart2 className="h-5 w-5 text-amber-500" /> },
    { name: "UI/UX Product Design", count: 9, color: "from-rose-500 to-pink-500", icon: <Layers className="h-5 w-5 text-rose-500" /> },
  ];

  const brands = [
    { name: "MICROSOFT", style: "hover:text-blue-500 hover:border-blue-500/20" },
    { name: "STRIPE", style: "hover:text-indigo-500 hover:border-indigo-500/20" },
    { name: "AMAZON", style: "hover:text-orange-500 hover:border-orange-500/20" },
    { name: "META", style: "hover:text-blue-600 hover:border-blue-600/20" },
    { name: "GOOGLE", style: "hover:text-red-500 hover:border-red-500/20" },
    { name: "VERCEL", style: "hover:text-zinc-900 dark:hover:text-white hover:border-zinc-500/20" },
  ];

  const testimonials = [
    {
      name: "Aravind Swamy",
      role: "SDE-2 at Microsoft",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
      content: "The curriculum at IndiWebPros is extremely practical. The hands-on capstone projects and mock interview coaching got me prepared to pass MS loops.",
    },
    {
      name: "Shruti Sharma",
      role: "Data Analyst at Stripe",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
      content: "Having an industry mentor review my code and give me structured optimization feedback was a game-changer. Absolutely worth every penny.",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="relative pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-x-2.5 rounded-full bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-8 hover:scale-102 transition-transform select-none">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              Cohort 2026 Starting Soon • Limited Spots Available
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl leading-tight">
              Master Software Engineering with{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-300 bg-clip-text text-transparent">
                IndiWebPros
              </span>
            </h1>
            <p className="mt-8 text-base sm:text-lg leading-relaxed text-zinc-550 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
              Skip generic courses. Build production-grade architectures with 1-on-1 industry mentorship, certified capstone portfolios, and comprehensive placement coaching.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={ROUTES.register} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_35px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                  Start Learning Free
                </Button>
              </Link>
              <Link to={ROUTES.courses} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4 text-zinc-400" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Logos */}
      <div className="border-y border-zinc-150 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Our students are employed by global engineering leaders
          </p>
          <div className="mx-auto mt-8 grid grid-cols-2 justify-items-center items-center gap-4 sm:grid-cols-3 lg:grid-cols-6 select-none">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className={`flex items-center justify-center w-full max-w-[140px] px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-850/50 text-zinc-400 dark:text-zinc-650 font-black text-xs tracking-wider transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${brand.style}`}
              >
                {brand.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics counters */}
      <div className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative p-8 md:p-10 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/80 shadow-inner grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 text-center">
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.studentsCount.toLocaleString()}+
              </span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Enrolled Students</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.coursesCount}+
              </span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Expert Curriculums</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.mentorsCount}+
              </span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Industry Mentors</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.placementRate}%
              </span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Placement Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories section */}
      <div className="bg-zinc-50/40 dark:bg-zinc-900/10 py-24 border-t border-zinc-150 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Industry-Aligned Pathways
            </h2>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-450 font-medium">
              Browse top paths mapped from entry-level foundational concepts to highly technical domain mastery.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200/70 dark:border-zinc-800/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 shadow-inner">
                      {cat.icon}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{cat.count} courses</span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.name}</h3>
                  <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Includes hands-on capstone builds, sandbox environments, and interactive assessment modules.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <Link to={ROUTES.courses} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    Explore Pathway <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="py-24 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Why Engineers Choose IndiWebPros
            </h2>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-450 font-medium">
              Unlike static video courses, we wrap education around real guidance, verified builds, and career mentorship.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-900 p-6 md:p-8">
            <table className="w-full border-collapse text-left text-xs sm:text-sm text-zinc-650 dark:text-zinc-350">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-4 font-bold text-zinc-900 dark:text-zinc-50 w-1/3">Feature</th>
                  <th className="pb-4 font-extrabold text-blue-600 dark:text-blue-400 w-1/3 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 fill-current/10" /> IndiWebPros LMS
                  </th>
                  <th className="pb-4 font-bold text-zinc-400 dark:text-zinc-600 w-1/3">Others (MOOCs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-medium">
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-550">1-on-1 Mentor Reviews</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 stroke-[3px]" /> Weekly Code Reviews
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">None / Peer Forums</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-555">Verified Capstones</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 stroke-[3px]" /> Production Deployments
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Static templates</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-555">Assessments</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 stroke-[3px]" /> Autograded Code Labs
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Basic MCQs</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-555">Certificates</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 stroke-[3px]" /> PDF Verification Logs
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Generic PDF</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="py-4 font-bold text-zinc-900 dark:text-zinc-555">Career Services</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 stroke-[3px]" /> Resume Reviews & Mock Loops
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Job board access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-zinc-50/40 dark:bg-zinc-900/10 py-24 border-t border-zinc-150 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Student Success Stories
            </h2>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-450 font-medium">
              See how our students transformed their careers and landed dream software engineering roles.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center gap-4 mb-5">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800" />
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm sm:text-base leading-none">{t.name}</h4>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-1.5">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 italic leading-relaxed font-medium">"{t.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="py-20 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-900 px-6 py-20 shadow-2xl rounded-3xl sm:px-24 border border-zinc-800">
            <div className="absolute top-0 right-0 w-84 h-84 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Stay updated on new course releases
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
                Subscribe to our newsletter to receive tech roadmaps, free tutorial snippets, and early course launch notifications.
              </p>
              <form
                className="mx-auto mt-8 flex flex-col sm:flex-row max-w-md gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
              >
                {subscribed ? (
                  <div className="w-full text-emerald-400 text-sm font-semibold py-2">
                    ✓ Thank you! You've successfully subscribed to our newsletter channel.
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-w-0 flex-auto rounded-2xl border-0 bg-white/5 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm leading-6"
                    />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition">
                      Subscribe
                    </Button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
