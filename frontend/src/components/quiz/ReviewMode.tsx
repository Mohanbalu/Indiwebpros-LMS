import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AttemptResultResponse, QuizAnswerRecord } from "@/types/quiz.types";

interface ReviewModeProps {
  result: AttemptResultResponse;
  onBack: () => void;
}

export function ReviewMode({ result, onBack }: ReviewModeProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Results
        </Button>
        <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
          Answer Review
        </h3>
      </div>

      <div className="space-y-4">
        {result.answers.map((answer, index) => (
          <ReviewQuestion key={answer.id} answer={answer} index={index} showCorrectAnswers={result.quiz?.showCorrectAnswers} />
        ))}
      </div>
    </div>
  );
}

function ReviewQuestion({
  answer,
  index,
  showCorrectAnswers,
}: {
  answer: QuizAnswerRecord;
  index: number;
  showCorrectAnswers: boolean;
}) {
  const question = answer.question;
  const isCorrect = answer.isCorrect;

  const getStudentAnswer = (): string => {
    if (answer.selectedOptionId) {
      const option = question.options.find((o) => o.id === answer.selectedOptionId);
      return option?.text || "Unknown";
    }
    if (answer.answerText) return answer.answerText;
    return "No answer";
  };

  const getCorrectAnswers = (): string[] => {
    return question.options.filter((o) => o.isCorrect).map((o) => o.text);
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span
            className={cn(
              "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
              isCorrect ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-200 leading-relaxed">
              <span className="text-zinc-500">Q{index + 1}.</span> {question.question}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={isCorrect ? "success" : "danger"}>
            {answer.marksAwarded >= 0 ? "+" : ""}{answer.marksAwarded} marks
          </Badge>
        </div>
      </div>

      <div className="pl-11 space-y-2">
        <div className="p-2.5 rounded-lg bg-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Your Answer</p>
          <p
            className={cn(
              "text-xs font-semibold",
              isCorrect ? "text-emerald-500" : "text-red-500"
            )}
          >
            {getStudentAnswer()}
          </p>
        </div>

        {showCorrectAnswers && !isCorrect && (
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Correct Answer</p>
            <p className="text-xs font-semibold text-emerald-500">
              {getCorrectAnswers().join(", ") || "No correct answer available"}
            </p>
          </div>
        )}

        {question.explanation && showCorrectAnswers && (
          <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Explanation</p>
            <p className="text-xs text-zinc-400">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
