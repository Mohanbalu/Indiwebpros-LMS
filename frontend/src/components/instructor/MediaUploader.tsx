import { useState, useRef } from "react";
import { Upload, X, RefreshCw, AlertCircle, FileText, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import axios from "axios";

interface MediaUploaderProps {
  uploadType: "thumbnail" | "video" | "resource" | "assignment" | "submission";
  onUploadSuccess: (fileRecord: any) => void;
  onDelete: () => void;
  currentFile?: { id: string; name: string; url: string; originalName?: string } | null;
  accept: string;
  maxSize: number;
  label?: string;
}

export function MediaUploader({
  uploadType,
  onUploadSuccess,
  onDelete,
  currentFile,
  accept,
  maxSize,
  label = "Upload file",
}: MediaUploaderProps) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState("");
  const [eta, setEta] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const cancelTokenRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (file.size > maxSize) {
      setError(`File size exceeds limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    setError("");
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadType", uploadType);

    cancelTokenRef.current = axios.CancelToken.source();
    const startTime = Date.now();

    try {
      const res = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        cancelToken: cancelTokenRef.current.token,
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total || loaded;
          const pct = Math.round((loaded * 100) / total);
          setProgress(pct);

          const elapsedMs = Date.now() - startTime;
          const speedBps = elapsedMs > 0 ? loaded / (elapsedMs / 1000) : 0;
          
          if (speedBps > 1024 * 1024) {
            setSpeed(`${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`);
          } else {
            setSpeed(`${(speedBps / 1024).toFixed(0)} KB/s`);
          }

          const remainingBytes = total - loaded;
          const etaSec = speedBps > 0 ? Math.round(remainingBytes / speedBps) : 0;
          if (etaSec > 60) {
            setEta(`${Math.floor(etaSec / 60)}m ${etaSec % 60}s`);
          } else {
            setEta(`${etaSec}s`);
          }
        },
      });

      setIsUploading(false);
      onUploadSuccess(res.data.data);
    } catch (err: any) {
      if (axios.isCancel(err)) {
        setError("Upload cancelled");
      } else {
        setError(err.response?.data?.message || err.message || "Upload failed");
      }
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
  };

  const handlePreview = async () => {
    if (!currentFile) return;
    try {
      const res = await api.get(`/storage/download-url/${currentFile.id}`);
      if (res.data?.success && res.data?.data?.downloadUrl) {
        window.open(res.data.data.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        window.open(currentFile.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to generate signed download URL", err);
      window.open(currentFile.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
          {label}
        </span>
        {currentFile && (
          <button 
            type="button" 
            onClick={onDelete}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>

      {/* Render Current File Status */}
      {currentFile ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-zinc-900 dark:text-white block truncate">
              {currentFile.originalName || currentFile.name}
            </span>
            <button 
              type="button"
              onClick={handlePreview}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold text-left block"
            >
              Preview asset →
            </button>
          </div>
        </div>
      ) : isUploading ? (
        /* Render Progress Bar */
        <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
            <span>Uploading ({progress}%)</span>
            <span className="text-zinc-400">{speed} • ETA: {eta}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-150" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={handleCancel}
              className="text-[10px] font-extrabold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase"
            >
              Cancel Upload
            </button>
          </div>
        </div>
      ) : (
        /* Render Drag Drop Zone */
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/5 dark:hover:bg-blue-950/5 rounded-2xl p-6 text-center cursor-pointer transition"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            accept={accept}
            className="hidden" 
          />
          <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
          <span className="text-xs font-bold text-zinc-900 dark:text-white block">
            Click to upload files
          </span>
          <span className="text-[10px] text-zinc-400 font-bold block mt-1">
            Drag drop, maximum size {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/10 text-[10px] font-bold">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
