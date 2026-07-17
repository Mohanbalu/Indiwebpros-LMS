import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MediaUploader } from "./MediaUploader";
import { api } from "@/services/api";

interface CourseSettingsTabProps {
  courseDetail: any;
  categories: any[];
  onUpdate: (data: any) => Promise<void>;
  refetch: () => void;
}

export function CourseSettingsTab({
  courseDetail,
  categories,
  onUpdate,
  refetch,
}: CourseSettingsTabProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    difficulty: "BEGINNER",
    language: "English",
    visibility: "PUBLIC",
    price: 0,
    discountPrice: null as number | null,
    certificateEnabled: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  // Requirements, outcomes, tags states
  const [reqs, setReqs] = useState<any[]>([]);
  const [newReq, setNewReq] = useState("");
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    if (courseDetail) {
      setForm({
        title: courseDetail.title || "",
        description: courseDetail.description || "",
        categoryId: courseDetail.categoryId || "",
        difficulty: courseDetail.difficulty || "BEGINNER",
        language: courseDetail.language || "English",
        visibility: courseDetail.visibility || "PUBLIC",
        price: courseDetail.price || 0,
        discountPrice: courseDetail.discountPrice || null,
        certificateEnabled: courseDetail.certificateEnabled !== false,
        seoTitle: courseDetail.seoTitle || "",
        seoDescription: courseDetail.seoDescription || "",
        seoKeywords: courseDetail.seoKeywords || "",
      });
      setReqs(courseDetail.requirements || []);
      setOutcomes(courseDetail.outcomes || []);
      setTags(courseDetail.tags || []);
    }
  }, [courseDetail]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      await onUpdate(form);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const handleMediaUpload = async (field: "thumbnailId" | "previewVideoId", fileRecord: any) => {
    try {
      await onUpdate({ [field]: fileRecord.id });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMediaDelete = async (field: "thumbnailId" | "previewVideoId") => {
    try {
      await onUpdate({ [field]: null });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Requirements operations
  const handleAddRequirement = async () => {
    if (!newReq.trim()) return;
    try {
      await api.post(`/courses/${courseDetail.id}/requirements`, { text: newReq });
      setNewReq("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      await api.delete(`/courses/requirements/${id}`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Outcomes operations
  const handleAddOutcome = async () => {
    if (!newOutcome.trim()) return;
    try {
      await api.post(`/courses/${courseDetail.id}/outcomes`, { text: newOutcome });
      setNewOutcome("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOutcome = async (id: string) => {
    try {
      await api.delete(`/courses/outcomes/${id}`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Tags operations
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      await api.post(`/courses/${courseDetail.id}/tags`, { name: newTag });
      setNewTag("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await api.delete(`/courses/${courseDetail.id}/tags/${tagId}`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns (Settings inputs) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Basic pathway info</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Pathway Title</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Category</label>
                  <select 
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Difficulty level</label>
                  <select 
                    value={form.difficulty}
                    onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Language</label>
                  <input 
                    type="text" 
                    value={form.language}
                    onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Visibility</label>
                  <select 
                    value={form.visibility}
                    onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value }))}
                    className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing settings */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Pricing settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Price (INR)</label>
                <input 
                  type="number" 
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Discount Price (INR)</label>
                <input 
                  type="number" 
                  value={form.discountPrice || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountPrice: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Requirements & Learning outcomes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Requirements list manager */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Prerequisites</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  placeholder="e.g. Basic JavaScript knowledge"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleAddRequirement}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {reqs.map((req) => (
                  <div key={req.id} className="flex justify-between items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-xs font-medium">
                    <span className="truncate">{req.text}</span>
                    <button type="button" onClick={() => handleDeleteRequirement(req.id)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes list manager */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Learning Outcomes</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g. Master database schema layouts"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleAddOutcome}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {outcomes.map((out) => (
                  <div key={out.id} className="flex justify-between items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-xs font-medium">
                    <span className="truncate">{out.text}</span>
                    <button type="button" onClick={() => handleDeleteOutcome(out.id)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEO Details */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">SEO settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">SEO Title</label>
                <input 
                  type="text" 
                  value={form.seoTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">SEO Description</label>
                <textarea 
                  value={form.seoDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  rows={2}
                  maxLength={160}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">SEO Keywords</label>
                <input 
                  type="text" 
                  value={form.seoKeywords}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoKeywords: e.target.value }))}
                  className="w-full mt-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  placeholder="e.g. react, lms, typescript"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column (Media uploads & saves) */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Save & changes</h3>
            <Button 
              type="submit" 
              className={`w-full py-3 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                saveStatus === "success" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : saveStatus === "error"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={saveStatus === "saving" || saveStatus === "success"}
            >
              {saveStatus === "saving" ? (
                "Saving..."
              ) : saveStatus === "success" ? (
                "✓ Saved Successfully!"
              ) : saveStatus === "error" ? (
                "✗ Failed to Save"
              ) : (
                <><Save className="h-4 w-4" /> Save Course Details</>
              )}
            </Button>
            {saveStatus === "success" && (
              <p className="text-[10px] text-emerald-600 font-extrabold text-center animate-pulse mt-2">
                Course details updated successfully!
              </p>
            )}
            {saveStatus === "error" && (
              <p className="text-[10px] text-rose-600 font-extrabold text-center animate-pulse mt-2">
                An error occurred while saving.
              </p>
            )}
          </div>

          {/* Media upload managers */}
          <MediaUploader 
            uploadType="thumbnail"
            label="Course Thumbnail Image"
            accept="image/jpeg,image/png,image/webp"
            maxSize={50 * 1024 * 1024}
            currentFile={courseDetail.thumbnail}
            onUploadSuccess={(file) => handleMediaUpload("thumbnailId", file)}
            onDelete={() => handleMediaDelete("thumbnailId")}
          />

          <MediaUploader 
            uploadType="video"
            label="Course Trailer/Preview Video"
            accept="video/mp4,video/webm"
            maxSize={500 * 1024 * 1024}
            currentFile={courseDetail.previewVideo}
            onUploadSuccess={(file) => handleMediaUpload("previewVideoId", file)}
            onDelete={() => handleMediaDelete("previewVideoId")}
          />

          {/* Tags manager */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Tags</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. Advanced"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
              <button 
                type="button" 
                onClick={handleAddTag}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((tagObj) => (
                <span 
                  key={tagObj.id} 
                  className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/10"
                >
                  {tagObj.name}
                  <button type="button" onClick={() => handleRemoveTag(tagObj.id)} className="text-blue-600/60 hover:text-rose-500 ml-0.5">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
