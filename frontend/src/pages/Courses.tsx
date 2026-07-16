import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Clock, Users, Star, ArrowRight, ShieldCheck, Grid, List, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { ROUTES } from "@/config/routes.config";

interface CourseItem {
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
  instructor: { firstName: string; lastName: string };
  createdAt: string;
}

const fallbackCourses: CourseItem[] = [
  {
    id: "course-1",
    title: "Advanced Full Stack TypeScript SaaS Architecture",
    slug: "full-stack-typescript-saas-architecture",
    description: "Build, secure, and deploy complete Next.js apps with Postgres, Prisma ORM, BullMQ queues, and Docker.",
    level: "Advanced",
    price: 199,
    duration: "12 Weeks",
    rating: 4.9,
    studentsCount: 1240,
    category: { name: "Full Stack Development" },
    instructor: { firstName: "Mohan", lastName: "Balu" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "course-2",
    title: "Production AI & Machine Learning Pipeline Engineer",
    slug: "production-ai-ml-pipeline-engineer",
    description: "Train models, build REST wrappers, containerize inference scripts, and orchestrate ML pipelines using AWS.",
    level: "Intermediate",
    price: 249,
    duration: "10 Weeks",
    rating: 4.8,
    studentsCount: 890,
    category: { name: "AI & Machine Learning" },
    instructor: { firstName: "Jessica", lastName: "Chen" },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "course-3",
    title: "Enterprise AWS Cloud Engineering & Infrastructure as Code",
    slug: "aws-cloud-engineering-iac",
    description: "Master Terraform, CloudFormation, VPC configurations, IAM secure policies, and ECS deployments on AWS.",
    level: "Advanced",
    price: 189,
    duration: "8 Weeks",
    rating: 4.7,
    studentsCount: 650,
    category: { name: "Cloud Computing" },
    instructor: { firstName: "David", lastName: "Miller" },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "course-4",
    title: "Foundations of Product UI/UX and User Research",
    slug: "foundations-product-ui-ux",
    description: "Learn client wireframing, high fidelity interactive Figma designs, visual typography rules, and usability testing.",
    level: "Beginner",
    price: 0,
    duration: "6 Weeks",
    rating: 4.9,
    studentsCount: 1540,
    category: { name: "UI/UX Product Design" },
    instructor: { firstName: "Jessica", lastName: "Chen" },
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function Courses() {
  // Search & suggestions state
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(["TypeScript", "AI", "Cloud"]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All"); // All, Free, Paid
  const [sortOption, setSortOption] = useState("Newest");

  // Fetching categories via React Query
  const { data: categoryRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data;
    },
  });

  // Fetching courses via React Query
  const { data: coursesRes, isLoading, error, refetch } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await api.get("/courses");
      return res.data;
    },
  });

  const categories = categoryRes?.success && Array.isArray(categoryRes.data)
    ? ["All", ...categoryRes.data.map((c: any) => c.name)]
    : ["All", "Full Stack Development", "AI & Machine Learning", "Cloud Computing", "UI/UX Product Design"];

  const rawCourses: CourseItem[] = coursesRes?.success && Array.isArray(coursesRes.courses)
    ? coursesRes.courses
    : fallbackCourses;


  // Handle Search suggestions
  useEffect(() => {
    if (search.length > 1) {
      const matched = rawCourses
        .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
        .map((c) => c.title)
        .slice(0, 5);
      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  }, [search, rawCourses]);

  const handleSearchSelect = (val: string) => {
    setSearch(val);
    setShowSuggestions(false);
    if (!recentSearches.includes(val)) {
      setRecentSearches([val, ...recentSearches.slice(0, 4)]);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  // Filter & Sort math
  const filteredCourses = rawCourses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      c.category.name.toLowerCase() === selectedCategory.toLowerCase();

    const matchesLevel =
      selectedLevel === "All" || c.level.toLowerCase() === selectedLevel.toLowerCase();

    const matchesPrice =
      priceFilter === "All" ||
      (priceFilter === "Free" && c.price === 0) ||
      (priceFilter === "Paid" && c.price > 0);

    return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
  });

  // Sorting
  filteredCourses.sort((a, b) => {
    if (sortOption === "Newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOption === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortOption === "Highest Rated") return b.rating - a.rating;
    if (sortOption === "Lowest Price") return a.price - b.price;
    if (sortOption === "Highest Price") return b.price - a.price;
    if (sortOption === "Alphabetical") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="bg-white dark:bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white mb-12 relative overflow-hidden shadow-lg shadow-blue-500/10">
          <div className="max-w-2xl relative z-10">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
              Pathway Catalog
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Find Your Perfect Course Path
            </h1>
            <p className="mt-4 text-base text-blue-100 max-w-xl">
              Learn advanced SaaS designs, microservice setups, and container pipelines with our autograded assessments.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-1/2 pointer-events-none" />
        </div>

        {/* Search Suggestion Component */}
        <div className="relative mb-8 max-w-3xl mx-auto z-20">
          <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm pr-3">
            <Search className="h-5 w-5 text-zinc-400 ml-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search courses, frameworks, concepts..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-transparent text-sm focus:outline-none text-zinc-900 dark:text-zinc-50"
            />
            {search && (
              <button onClick={clearSearch} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>

          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xl z-30 p-4">
              {suggestions.length > 0 ? (
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Suggestions</h4>
                  <ul className="space-y-1.5">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => handleSearchSelect(s)}
                          className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 py-1"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Recent Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchSelect(s)}
                        className="text-xs px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-zinc-800/80 text-right">
                <button onClick={() => setShowSuggestions(false)} className="text-xs font-bold text-zinc-400 hover:text-zinc-650">
                  Close Suggestions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Marketplace Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-blue-600" /> Filters
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedLevel("All");
                    setPriceFilter("All");
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Categories selection */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                  Categories
                </label>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty level */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                  Difficulty Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Price filter */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                  Pricing Models
                </label>
                <div className="flex gap-2">
                  {["All", "Free", "Paid"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setPriceFilter(item)}
                      className={`flex-1 text-center text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                        priceFilter === item
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Course Listing grid */}
          <div className="lg:col-span-3">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">
                Showing {filteredCourses.length} pathways
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-medium">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="py-1 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Highest Rated">Highest Rated</option>
                  <option value="Lowest Price">Lowest Price</option>
                  <option value="Highest Price">Highest Price</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Courses grid rendering */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-80 border border-zinc-200 dark:border-zinc-800" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/10 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80">
                <p className="text-zinc-500 dark:text-zinc-400">No pathways matched your search parameters.</p>
                <Button variant="ghost" className="mt-4" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="course-card group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {course.category.name}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                          {course.level}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-zinc-400" /> {course.studentsCount} Students
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {course.rating}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                        {course.price === 0 ? "Free" : `$${course.price}`}
                      </span>
                      <Link to={`/courses/${course.slug}`}>
                        <Button size="sm" variant="ghost" className="group-hover:translate-x-1 transition-transform duration-200">
                          View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
