import { Sparkles, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CompletionBannerProps {
  courseTitle: string;
  certificateAvailable: boolean;
  onViewCertificate: () => void;
  onContinueLearning: () => void;
}

export function CompletionBanner({
  courseTitle,
  certificateAvailable,
  onViewCertificate,
  onContinueLearning,
}: CompletionBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 h-4 w-4 rounded-full bg-white/20 animate-ping" />
        <div className="absolute top-1/4 right-1/4 h-3 w-3 rounded-full bg-white/10 animate-ping" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Course Completed
              </span>
            </div>
            <h2 className="text-lg font-black">{courseTitle}</h2>
          </div>
        </div>

        <p className="text-sm text-blue-100 leading-relaxed max-w-lg">
          Congratulations on completing this course!{certificateAvailable
            ? " Your certificate is ready."
            : " Your certificate is being processed and will be available soon."}
        </p>

        <div className="flex flex-wrap gap-3">
          {certificateAvailable && (
            <Button
              onClick={onViewCertificate}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg"
              size="lg"
            >
              View Certificate <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
          <Button
            onClick={onContinueLearning}
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/15"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    </div>
  );
}
