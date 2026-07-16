import React from "react";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { BookmarkItem } from "@/services/player.service";

interface BookmarkPanelProps {
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (id: string) => void;
  onNavigateToLesson: (lessonId: string) => void;
}

export function BookmarkPanel({
  bookmarks,
  onRemoveBookmark,
  onNavigateToLesson,
}: BookmarkPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-4">
        Course Bookmarks
      </h3>

      {bookmarks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-450 dark:text-zinc-500 text-xs">
          <Bookmark className="h-8 w-8 mx-auto mb-2 text-zinc-350" />
          No bookmarks saved for this course. Click the bookmark icon next to the lesson title to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-4 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <button
                onClick={() => onNavigateToLesson(bookmark.lessonId)}
                className="flex items-center gap-3 text-left focus:outline-none flex-1 min-w-0"
              >
                <Bookmark className="h-4 w-4 text-blue-500 fill-blue-500/10 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-xs font-bold text-zinc-850 dark:text-zinc-150 block truncate">
                    {bookmark.lesson?.title || "Bookmarked Segment"}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                    Jump to lesson <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
              </button>

              <button
                onClick={() => onRemoveBookmark(bookmark.id)}
                className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-500 transition focus:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
