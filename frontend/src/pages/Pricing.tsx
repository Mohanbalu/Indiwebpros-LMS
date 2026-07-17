import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes.config";

export default function Pricing() {
  const tiers = [
    {
      name: "Basic",
      price: "Free",
      description: "Get started with foundational concept paths and interactive community forums.",
      features: [
        "Access to basic curriculum courses",
        "Community forum discussions",
        "Public certificates of completion",
        "Self-paced learning structure",
      ],
      cta: "Sign Up For Free",
      popular: false,
    },
    {
      name: "Intermediate",
      price: "$19",
      description: "Perfect for builders leveling up their practical skills with auto-graded labs.",
      features: [
        "Access to intermediate curriculum courses",
        "Autograded coding assessment labs",
        "Verified PDF certificates",
        "3 scheduled mentoring sessions/mo",
        "Priority community support",
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
    {
      name: "Advanced",
      price: "$49",
      description: "Designed for engineers targeting premium software developer positions.",
      features: [
        "Access to advanced SaaS architecture tracks",
        "Unrestricted autograded sandbox labs",
        "1-on-1 code reviews by senior mentors",
        "Unlimited scheduled mentoring sessions",
        "Resume audit & placement mock interview loops",
      ],
      cta: "Join Advanced Path",
      popular: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Simple, Transparent Subscription Plans
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
            Choose a plan that fits your career aspirations. No lock-in, cancel any time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col justify-between rounded-3xl p-8 bg-white dark:bg-zinc-900 border ${
                tier.popular
                  ? "border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500 shadow-lg"
                  : "border-zinc-200/60 dark:border-zinc-800/80 shadow-sm"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{tier.name}</h3>
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{tier.price}</span>
                  {tier.price !== "Free" && (
                    <span className="text-sm text-zinc-400 dark:text-zinc-500">/month</span>
                  )}
                </div>

                <ul className="mt-8 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link to={ROUTES.register}>
                  <Button
                    className="w-full"
                    variant={tier.popular ? "primary" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
