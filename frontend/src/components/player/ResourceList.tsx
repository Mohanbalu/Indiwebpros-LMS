import React from "react";
import { Download, File, ExternalLink, HelpCircle, HardDrive } from "lucide-react";
import { ResourceAttachment } from "@/services/player.service";

interface ResourceListProps {
  resources: ResourceAttachment[];
  onDownload: (resourceId: string) => void;
}

export function ResourceList({ resources, onDownload }: ResourceListProps) {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <File className="h-4 w-4 text-amber-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-4">
        Downloads & Resources
      </h3>

      {resources.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-450 dark:text-zinc-500 text-xs">
          <HardDrive className="h-8 w-8 mx-auto mb-2 text-zinc-350" />
          No resources attached to this lesson segment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {getResourceIcon(resource.resourceType)}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-zinc-850 dark:text-zinc-150 block truncate">
                    {resource.title}
                  </span>
                  <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-medium block mt-0.5">
                    {resource.fileName} ({formatSize(resource.fileSize)})
                  </span>
                </div>
              </div>

              {resource.allowDownload && resource.downloadUrl ? (
                <a
                  href={resource.downloadUrl}
                  download
                  onClick={() => onDownload(resource.id)}
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition"
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl">
                  Locked
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
