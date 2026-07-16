import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: "Are the courses self-paced or cohort-based?",
      a: "All paths are self-paced, allowing you to learn at your convenience. However, scheduled mentoring slots and code review feedbacks are available weekly to keep you on track.",
    },
    {
      q: "How does the 1-on-1 mentor code review work?",
      a: "When you submit a module assignment/milestone build, an expert mentor reviews your code structures, checks for security flaws, confirms data constraints, and returns inline styling/performance improvement notes.",
    },
    {
      q: "Can I get a refund if I am not satisfied?",
      a: "Yes, we support a 30-day money-back guarantee policy. If you decide the pathway does not meet your training expectations, let us know within 30 days of purchase for a complete refund.",
    },
    {
      q: "How are certificates verified?",
      a: "Every certificate issued contains a cryptographically signed UUID, letting external employers query our public certificate registries to verify credential authenticity instantly.",
    },
  ];

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
            Got questions about mentoring, refunds, or certificates? Find quick answers below.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-10 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filtered.map((faq, idx) => (
            <div
              key={idx}
              className="border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-50/50 dark:bg-zinc-900/10 focus:outline-none text-sm"
              >
                <span>{faq.q}</span>
                {openIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {openIdx === idx && (
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-905 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-zinc-400 py-10 font-medium text-sm">No match found for "{search}".</p>
          )}
        </div>
      </div>
    </div>
  );
}
