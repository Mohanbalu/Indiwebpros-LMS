import React from "react";
import { Award, Sparkles, X, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  onStartQuiz?: () => void;
  onViewCertificate?: () => void;
  certificateAvailable?: boolean;
  hasQuiz: boolean;
  quizPassed?: boolean;
}

export function CompletionDialog({
  isOpen,
  onClose,
  courseTitle,
  onStartQuiz,
  onViewCertificate,
  certificateAvailable = false,
  hasQuiz,
  quizPassed = false,
}: CompletionDialogProps) {
  if (!isOpen) return null;

  const showCertificate = certificateAvailable && quizPassed;
  const showQuiz = hasQuiz && !quizPassed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-2xl animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-550 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex justify-center mb-6">
          <div className="absolute -top-3 -left-3 animate-ping">
            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="h-20 w-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
            <Award className="h-12 w-12" />
          </div>
          <div className="absolute -bottom-2 -right-2 animate-bounce">
            <Sparkles className="h-5 w-5 text-blue-500 fill-blue-500/20" />
          </div>
        </div>

        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2">
          Congratulations! 🎉
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 px-2 leading-relaxed">
          You have successfully completed all the curriculum segments for
          <span className="block font-extrabold text-zinc-850 dark:text-zinc-200 mt-1">
            "{courseTitle}"
          </span>
        </p>

        <div className="space-y-3">
          {showQuiz ? (
            <Button
              onClick={() => {
                onClose();
                onStartQuiz?.();
              }}
              className="w-full flex items-center justify-center gap-1.5 generate-certificate-btn"
              size="lg"
            >
              Take Final Assessment <ChevronRight className="h-4 w-4" />
            </Button>
          ) : showCertificate ? (
            <Button
              onClick={() => {
                onClose();
                onViewCertificate?.();
              }}
              className="w-full flex items-center justify-center gap-1.5 certificate-download-link"
              size="lg"
            >
              <ExternalLink className="h-4 w-4" />
              View Certificate
            </Button>
          ) : (
            <Button onClick={onClose} className="w-full" size="lg">
              Continue Learning
            </Button>
          )}

          {!showCertificate && quizPassed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onViewCertificate?.();
              }}
              className="w-full"
            >
              Check Certificates
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
