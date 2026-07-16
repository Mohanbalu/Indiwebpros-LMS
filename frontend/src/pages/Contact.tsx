import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Get in touch with us
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
            Have questions about our curriculums, mentor networks, or enterprise options? Drop us a line.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Info cards */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex gap-4">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Email support channels</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Our support coordinators respond within 24 hours.</p>
                <p className="mt-2 font-semibold text-blue-600 dark:text-blue-400 text-sm">support@indiwebpros.com</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex gap-4">
              <Phone className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Telephone Desk</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Available Monday through Friday, 9am to 6pm IST.</p>
                <p className="mt-2 font-semibold text-indigo-600 dark:text-indigo-400 text-sm">+91 (80) 4123-5678</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex gap-4">
              <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Bengaluru Office Location</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Public relations desk & engineering lab.</p>
                <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                  IndiWebPros Tech Hub, 4th Floor, Sector 7, HSR Layout, Bengaluru, Karnataka, India - 560102
                </p>
              </div>
            </div>
          </div>

          {/* Form wrapper */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Send us a direct message</h3>
            {submitted ? (
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-center py-10">
                ✓ Message received successfully! Our student success coordinator will reach out shortly.
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.name && form.email && form.message) setSubmitted(true);
                }}
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <Button type="submit" className="w-full flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
