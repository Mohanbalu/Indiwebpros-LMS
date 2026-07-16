import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, Video, Clock, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NoteItem } from "@/services/player.service";

interface NotesPanelProps {
  notes: NoteItem[];
  currentTimestamp: number;
  onCreateNote: (payload: { title?: string; content: string; videoTimestamp: number }) => void;
  onUpdateNote: (id: string, payload: { title?: string; content: string; videoTimestamp?: number }) => void;
  onDeleteNote: (id: string) => void;
  onSeekTo?: (seconds: number) => void;
}

export function NotesPanel({
  notes,
  currentTimestamp,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onSeekTo,
}: NotesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  // Edit states
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    onCreateNote({
      title: noteTitle.trim() || undefined,
      content: noteContent.trim(),
      videoTimestamp: includeTimestamp ? Math.floor(currentTimestamp) : 0,
    });

    // Reset
    setNoteTitle("");
    setNoteContent("");
    setIsCreating(false);
  };

  const handleEditSubmit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdateNote(id, {
      title: editTitle.trim() || undefined,
      content: editContent.trim(),
    });
    setEditingId(null);
  };

  const startEditing = (note: NoteItem) => {
    setEditingId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.title && n.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Add Note Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-150 focus:outline-none"
          />
        </div>
        {!isCreating && (
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Note
          </Button>
        )}
      </div>

      {/* Note Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-300">New Study Note</h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Title (Optional)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-850 dark:text-zinc-100 focus:outline-none"
          />

          <textarea
            placeholder="Write your note contents here..."
            value={noteContent}
            required
            rows={3}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-850 dark:text-zinc-100 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-0"
              />
              <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-500 flex items-center gap-1">
                <Video className="h-3 w-3" /> Capture timestamp ({formatTime(currentTimestamp)})
              </span>
            </label>

            <Button type="submit" size="sm" className="text-xs">
              Save Note
            </Button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-450 dark:text-zinc-500 text-xs">
            <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-350" />
            No notes logged for this segment.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className="p-4 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 rounded-2xl space-y-2.5 transition-all shadow-sm"
              >
                {isEditing ? (
                  // Inline Edit Form
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                    />
                    <textarea
                      value={editContent}
                      rows={2}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-7 text-[10px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditSubmit(note.id)}
                        className="h-7 text-[10px]"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Default Mode Display
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        {note.title && (
                          <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-100">
                            {note.title}
                          </h4>
                        )}
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-550 block mt-0.5">
                          Created {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Controls Buttons */}
                      <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition">
                        <button
                          onClick={() => startEditing(note)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-605 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>

                    {/* Timestamp seek click */}
                    {note.videoTimestamp > 0 && (
                      <button
                        onClick={() => onSeekTo?.(note.videoTimestamp)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition focus:outline-none"
                      >
                        <Clock className="h-3 w-3" /> {formatTime(note.videoTimestamp)}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
