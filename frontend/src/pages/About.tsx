import { Users, Award, BookOpen, Star } from "lucide-react";

export default function About() {
  const team = [
    {
      name: "Mohan Balu",
      role: "Founder & Chief Architect",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120",
      bio: "Ex-Google Staff Engineer. Architected microservices serving millions of active users.",
    },
    {
      name: "Jessica Chen",
      role: "Head of Curriculum",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
      bio: "Former Associate Professor in CS. Focused on project-based education models.",
    },
    {
      name: "David Miller",
      role: "Lead Mentor Liaison",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
      bio: "Ex-AWS Principal Dev. Passionate about guiding junior engineers into senior roles.",
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Our Mission is to Empower Engineers
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
            IndiWebPros was founded with a simple vision: to bridge the gap between academic theories and practical enterprise software development.
          </p>
        </div>

        {/* Values grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-20">
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Industry First</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              We design our course modules to mimic real workflows, database structures, and production deployment paradigms.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">1-on-1 Mentorship</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Every student gets paired with an industry practitioner who provides code reviews, design feedback, and career guidance.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <Award className="h-8 w-8 text-teal-600 dark:text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Verified Skills</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Our automated assessments and certificate platform provide cryptographic validation of your practical coding skills.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-zinc-50/50 dark:bg-zinc-900/10 rounded-3xl p-8 sm:p-12 border border-zinc-200/60 dark:border-zinc-800/80 mb-20">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Our Story</h2>
          <div className="space-y-4 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            <p>
              We realized that most online courses focus on syntax tutorials. Students finish multiple courses but struggle to build a real enterprise app, design normalized database schemas, or handle secure authentication.
            </p>
            <p>
              We built IndiWebPros to change that. We created a sandbox assessment engine, integrated automated project builds, and paired it with a network of verified engineers who review candidate code. Today, our students work at leading SaaS and cloud companies globally.
            </p>
          </div>
        </div>

        {/* Team list */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 text-center">Meet Our Leadership</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {team.map((m, idx) => (
              <div key={idx} className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
                <img src={m.avatar} alt={m.name} className="h-20 w-20 rounded-full mx-auto object-cover mb-4" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{m.name}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-3">{m.role}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
