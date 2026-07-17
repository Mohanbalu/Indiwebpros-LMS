import { QUESTION_TYPE_LABELS } from "@/types/quiz.types";
import type { QuizQuestionData } from "@/types/quiz.types";
import { MCQSingle } from "./question-types/MCQSingle";
import { MCQMultiple } from "./question-types/MCQMultiple";
import { TrueFalse } from "./question-types/TrueFalse";
import { ShortAnswer } from "./question-types/ShortAnswer";
import { EssayAnswer } from "./question-types/EssayAnswer";
import { FileUpload } from "./question-types/FileUpload";

interface QuestionCardProps {
  question: QuizQuestionData;
  questionNumber: number;
  selectedOptionId: string | null;
  selectedOptionIds: string[];
  answerText: string;
  onSingleSelect: (optionId: string) => void;
  onMultiToggle: (optionId: string) => void;
  onTextChange: (value: string) => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  selectedOptionId,
  selectedOptionIds,
  answerText,
  onSingleSelect,
  onMultiToggle,
  onTextChange,
  disabled,
}: QuestionCardProps) {
  const renderQuestionBody = () => {
    switch (question.questionType) {
      case "MULTIPLE_CHOICE_SINGLE":
        return (
          <MCQSingle
            options={question.options}
            selectedOptionId={selectedOptionId}
            onSelect={onSingleSelect}
            disabled={disabled}
          />
        );
      case "MULTIPLE_CHOICE_MULTIPLE":
        return (
          <MCQMultiple
            options={question.options}
            selectedOptionIds={selectedOptionIds}
            onToggle={onMultiToggle}
            disabled={disabled}
          />
        );
      case "TRUE_FALSE":
        return (
          <TrueFalse
            options={question.options}
            selectedOptionId={selectedOptionId}
            onSelect={onSingleSelect}
            disabled={disabled}
          />
        );
      case "SHORT_ANSWER":
      case "FILL_IN_THE_BLANK":
        return (
          <ShortAnswer
            value={answerText}
            onChange={onTextChange}
            disabled={disabled}
          />
        );
      case "LONG_ANSWER":
      case "CODE_SNIPPET":
        return (
          <EssayAnswer
            value={answerText}
            onChange={onTextChange}
            disabled={disabled}
          />
        );
      case "FILE_UPLOAD":
        return (
          <FileUpload
            value={answerText}
            onChange={onTextChange}
            disabled={disabled}
          />
        );
      default:
        return (
          <ShortAnswer
            value={answerText}
            onChange={onTextChange}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-600/15 text-blue-500 flex items-center justify-center text-xs font-black">
          {questionNumber}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100 leading-relaxed">
            {question.question}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {QUESTION_TYPE_LABELS[question.questionType]}
            </span>
            <span className="text-[10px] text-zinc-600">|</span>
            <span className="text-[10px] font-bold text-zinc-500">
              {question.marks} {question.marks === 1 ? "mark" : "marks"}
            </span>
            {question.negativeMarks > 0 && (
              <>
                <span className="text-[10px] text-zinc-600">|</span>
                <span className="text-[10px] font-bold text-red-500">
                  -{question.negativeMarks} penalty
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pl-11">{renderQuestionBody()}</div>
    </div>
  );
}
