import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Star, ArrowRight, BookOpen, Users, Award, ShieldAlert, Activity, CheckCircle, ChevronDown } from "lucide-react";
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
    { name: "Full Stack Development", count: 18, color: "from-blue-500 to-indigo-500" },
    { name: "AI & Machine Learning", count: 12, color: "from-purple-500 to-pink-500" },
    { name: "Cloud Computing (AWS/Azure)", count: 14, color: "from-cyan-500 to-blue-500" },
    { name: "Cyber Security", count: 8, color: "from-teal-500 to-emerald-500" },
    { name: "Data Science & Python", count: 10, color: "from-amber-500 to-orange-500" },
    { name: "UI/UX Product Design", count: 9, color: "from-rose-500 to-pink-500" },
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
    <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="relative pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-x-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              Cohort 2026 Starting Soon • Limited Spots Available
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl leading-none">
              Master Software Engineering with{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 bg-clip-text text-transparent">
                IndiWebPros
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Skip generic courses. Build production-grade architectures with 1-on-1 industry mentorship, certified capstone portfolios, and comprehensive placement coaching.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to={ROUTES.register}>
                <Button size="lg" className="shadow-lg shadow-blue-500/20">
                  Start Learning Free
                </Button>
              </Link>
              <Link to={ROUTES.courses}>
                <Button variant="outline" size="lg">
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Logos */}
      <div className="border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Our students are employed by global engineering leaders
          </p>
          <div className="mx-auto mt-6 grid grid-cols-2 justify-items-center gap-y-4 sm:grid-cols-3 lg:grid-cols-6 text-zinc-400 dark:text-zinc-600 font-bold text-lg select-none">
            <span>MICROSOFT</span>
            <span>STRIPE</span>
            <span>AMAZON</span>
            <span>META</span>
            <span>GOOGLE</span>
            <span>VERCEL</span>
          </div>
        </div>
      </div>

      {/* Statistics counters */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 text-center">
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.studentsCount.toLocaleString()}+
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Enrolled Students</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.coursesCount}+
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Expert Curriculums</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.mentorsCount}+
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Industry Mentors</span>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {stats.placementRate}%
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Placement Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories section */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/10 py-20 border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Industry-Aligned Pathways
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Browse top paths mapped from entry-level foundational concepts to highly technical domain mastery.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className={`h-2 w-12 rounded bg-gradient-to-r ${cat.color} mb-4`} />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{cat.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Includes hands-on capstones, labs, and interactive assessment quiz pools.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">{cat.count} courses</span>
                  <Link to={ROUTES.courses} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                    Browse Track <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Why Engineers Choose IndiWebPros
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Unlike static video courses, we wrap education around real guidance, verified builds, and career guidance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-4 font-semibold text-zinc-900 dark:text-zinc-50">Feature</th>
                  <th className="py-4 font-semibold text-blue-600 dark:text-blue-400">IndiWebPros LMS</th>
                  <th className="py-4 font-semibold text-zinc-400 dark:text-zinc-600">Others (MOOCs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                <tr>
                  <td className="py-4 text-zinc-900 dark:text-zinc-50">1-on-1 Mentor Reviews</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Weekly Code Reviews
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">None / Peer Forums</td>
                </tr>
                <tr>
                  <td className="py-4 text-zinc-900 dark:text-zinc-50">Verified Capstones</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Production Deployments
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Static templates</td>
                </tr>
                <tr>
                  <td className="py-4 text-zinc-900 dark:text-zinc-50">Assessments</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Autograded Code Labs
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Basic MCQs</td>
                </tr>
                <tr>
                  <td className="py-4 text-zinc-900 dark:text-zinc-50">Certificates</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> PDF Verification Logs
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Generic PDF</td>
                </tr>
                <tr>
                  <td className="py-4 text-zinc-900 dark:text-zinc-50">Career Services</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Resume Reviews & Mock Loops
                  </td>
                  <td className="py-4 text-zinc-400 dark:text-zinc-600">Job board access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/10 py-20 border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Student Success Stories
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              See how our students transformed their careers and landed dream software engineering roles.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{t.name}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic font-medium">"{t.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-zinc-900 px-6 py-24 shadow-2xl rounded-3xl sm:px-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stay updated on new course releases
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-300">
                Subscribe to our newsletter to receive tech roadmaps, free tutorial snippets, and early course launch notifications.
              </p>
              <form
                className="mx-auto mt-10 flex max-w-md gap-x-4"
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
                      className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                    />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
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
