import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Save, Loader2, Globe, Phone, MapPin, Building, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProfileUpdateInput } from "@/services/profile.service";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    college: string;
    github: string;
    linkedin: string;
    portfolio: string;
    country: string;
    city: string;
    state?: string;
    timezone?: string;
    language?: string;
    gender?: string;
    dateOfBirth?: string;
  };
  onSave: (data: ProfileUpdateInput) => Promise<any>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  initialValues,
  onSave,
}: EditProfileModalProps) {
  const [form, setForm] = useState<ProfileUpdateInput>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setForm({
        firstName: initialValues.firstName || "",
        lastName: initialValues.lastName || "",
        phone: initialValues.phone || "",
        bio: initialValues.bio || "",
        college: initialValues.college || "",
        github: initialValues.github || "",
        linkedin: initialValues.linkedin || "",
        portfolio: initialValues.portfolio || "",
        country: initialValues.country || "",
        city: initialValues.city || "",
        state: initialValues.state || "",
        timezone: initialValues.timezone || "Asia/Kolkata",
        language: initialValues.language || "English",
        gender: initialValues.gender || "",
        dateOfBirth: initialValues.dateOfBirth || "",
      });
    }
  }, [initialValues, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Edit Student Profile
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Basic Info Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="edit-fname"
                  label="First Name"
                  value={form.firstName || ""}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <Input
                  id="edit-lname"
                  label="Last Name"
                  value={form.lastName || ""}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="edit-email"
                  label="Email Address (Read-Only)"
                  value={initialValues.email}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed opacity-75"
                />
                <Input
                  id="edit-phone"
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Bio & Education */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                About & College
              </h4>
              <div>
                <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Biography (Bio)
                </label>
                <textarea
                  rows={3}
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Share a short bio about your learning goals and tech stack..."
                  className="w-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-zinc-200"
                />
              </div>
              <Input
                id="edit-college"
                label="College / Institution Name"
                placeholder="e.g. Indian Institute of Technology"
                value={form.college || ""}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
              />
            </div>

            {/* Location & Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Location & Timezone
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="edit-country"
                  label="Country"
                  placeholder="e.g. India"
                  value={form.country || ""}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
                <Input
                  id="edit-city"
                  label="City"
                  placeholder="e.g. Bengaluru"
                  value={form.city || ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Social Profiles & Portfolio
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  id="edit-gh"
                  label="GitHub Handle / URL"
                  placeholder="github.com/username"
                  value={form.github || ""}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                />
                <Input
                  id="edit-li"
                  label="LinkedIn Profile"
                  placeholder="linkedin.com/in/username"
                  value={form.linkedin || ""}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
                <Input
                  id="edit-portfolio"
                  label="Portfolio Website"
                  placeholder="https://mywebsite.com"
                  value={form.portfolio || ""}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                />
              </div>
            </div>

            {/* Footer Buttons inside Form */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 text-white flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
