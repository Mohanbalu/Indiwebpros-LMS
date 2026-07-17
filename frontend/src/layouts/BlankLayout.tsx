import { Outlet } from "react-router-dom";
import { Check, Star, Sparkles, Code, Brain, Cloud, Shield, Activity } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export function BlankLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-300">
      
      {/* LEFT SIDE (45%) - Branding Hero Section (hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 p-12 flex-col justify-between border-r border-zinc-800/40 select-none">
        {/* Dotted Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Soft Glowing Gradient Blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Logo className="text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">IWP LMS</span>
        </div>

        {/* Core Value Proposition */}
        <div className="relative z-10 my-auto py-12 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Developer LMS
            </span>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Learn. <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Build.</span> Grow.
            </h2>
            <p className="text-sm xl:text-base text-zinc-450 leading-relaxed max-w-md font-medium">
              Master modern tech pathways built for real-world excellence. Engage with autograded sandboxes, 1-on-1 code mentorship, and verifiable capstones.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { text: "40+ Tech Pathways", desc: "Expert syllabus scopes" },
              { text: "Production Builds", desc: "Real capstone deploy logs" },
              { text: "Verifiable Certs", desc: "Cryptographic PDF signs" },
              { text: "1-on-1 Mentorship", desc: "Direct engineering reviews" },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3px]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">{feature.text}</span>
                  <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">{feature.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Course Preview (Glassmorphic Mock Card) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md shadow-xl flex items-center gap-4 max-w-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Code className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Currently Enrolling</span>
              <span className="text-xs font-bold text-white block truncate mt-0.5">TypeScript SaaS Architecture</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
              <Star className="h-3 w-3 fill-current" /> 4.9
            </div>
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/60 pt-6">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">15K+</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Active Enrolled</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">94.5%</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Placement Rate</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">45+</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Expert Mentors</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (55%) - Content Container (Takes full screen on mobile/tablet) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10 relative overflow-hidden">
        {/* Subtle grid for right side too */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Tiny responsive logo block for mobile views */}
        <div className="lg:hidden flex items-center gap-2 mb-8 select-none">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Logo className="text-white h-5 w-5" />
          </div>
          <span className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">IWP LMS</span>
        </div>

        <div className="relative z-10 w-full max-w-[450px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
