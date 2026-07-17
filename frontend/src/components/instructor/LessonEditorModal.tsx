import { useState, useEffect } from "react";
import { X, Play, FileText, Settings, Video, FileCheck, Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MediaUploader } from "./MediaUploader";
import { api } from "@/services/api";

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: any;
  refetch: () => void;
}

export function LessonEditorModal({
  isOpen,
  onClose,
  lesson,
  refetch,
}: LessonEditorModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 15,
    isPreview: false,
    status: "DRAFT",
    lessonType: "VIDEO",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [video, setVideo] = useState<any | null>(null);

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || "",
        description: lesson.description || "",
        durationMinutes: Math.round((lesson.durationSeconds || 0) / 60) || 15,
        isPreview: lesson.isPreview === true,
        status: lesson.status || "DRAFT",
        lessonType: lesson.lessonType || "VIDEO",
      });
      setResources(lesson.resources || []);
      setVideo(lesson.video || null);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/courses/lessons/${lesson.id}`, {
        title: form.title,
        description: form.description,
        durationSeconds: form.durationMinutes * 60,
        isPreview: form.isPreview,
        status: form.status,
        lessonType: form.lessonType,
      });
      refetch();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Video attachment updates
  const handleVideoUpload = async (fileRecord: any) => {
    try {
      const res = await api.put(`/courses/lessons/${lesson.id}`, { videoId: fileRecord.id });
      if (res.data?.success && res.data?.data) {
        setVideo(res.data.data.video || null);
      }
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoDelete = async () => {
    try {
      await api.put(`/courses/lessons/${lesson.id}`, { videoId: null });
      setVideo(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Resources list actions
  const handleResourceUpload = async (fileRecord: any) => {
    try {
      const res = await api.post(`/courses/lessons/${lesson.id}/resources`, {
        title: fileRecord.originalName || fileRecord.name,
        fileId: fileRecord.id,
        resourceType: "OTHER",
        allowDownload: true,
      });
      if (res.data?.success && res.data?.data) {
        setResources((prev) => [...prev, res.data.data]);
      }
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResource = async (resId: string) => {
    try {
      await api.delete(`/courses/resources/${resId}`);
      setResources((prev) => prev.filter((r) => r.id !== resId));
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">Configure Lesson settings</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left pane: Details Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Lesson Title</label>
              <input 
                type="text" 
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Description</label>
              <textarea 
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Lesson Type</label>
                <select 
                  value={form.lessonType}
                  onChange={(e) => setForm((prev) => ({ ...prev, lessonType: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                >
                  <option value="VIDEO">Video</option>
                  <option value="PDF">PDF Document</option>
                  <option value="ARTICLE">Text Article</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Duration (mins)</label>
                <input 
                  type="number" 
                  value={form.durationMinutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.isPreview}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPreview: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-zinc-300 dark:border-zinc-800"
                />
                Preview Free (Guest access)
              </label>

              <div>
                <select 
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-bold"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5"
              disabled={isSaving}
            >
              <FileCheck className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </form>

          {/* Right pane: Upload attachments and materials */}
          <div className="space-y-6">
            {form.lessonType === "VIDEO" && (
              <MediaUploader 
                uploadType="video"
                label="Lesson Video Material"
                accept="video/mp4,video/webm"
                maxSize={500 * 1024 * 1024}
                currentFile={video}
                onUploadSuccess={handleVideoUpload}
                onDelete={handleVideoDelete}
              />
            )}

            {/* Downloadable Resources attachments list */}
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Lesson Resources / Materials
              </span>

              {/* Attachments List */}
              <div className="space-y-1.5">
                {resources.map((res) => (
                  <div key={res.id} className="flex justify-between items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850 text-xs font-semibold">
                    <span className="truncate flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" /> {res.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <a href={res.file?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button type="button" onClick={() => handleDeleteResource(res.id)} className="text-rose-500 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload dynamic resource attachment */}
              <MediaUploader 
                uploadType="resource"
                label="Attach Resource Attachment"
                accept="application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                maxSize={50 * 1024 * 1024}
                onUploadSuccess={handleResourceUpload}
                onDelete={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
