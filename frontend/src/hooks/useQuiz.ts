import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizService } from "@/services/quiz.service";
import type { SubmitAttemptPayload } from "@/types/quiz.types";

export function useQuizDetail(quizId: string) {
  return useQuery({
    queryKey: ["quizDetail", quizId],
    queryFn: () => quizService.getQuiz(quizId),
    enabled: !!quizId,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => quizService.startAttempt(quizId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizAttempt", data.attemptId] });
    },
  });
}

export function useResumeQuizAttempt(attemptId: string, enabled = true) {
  return useQuery({
    queryKey: ["quizAttempt", attemptId],
    queryFn: () => quizService.resumeAttempt(attemptId),
    enabled: !!attemptId && enabled,
    retry: false,
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitAttemptPayload) => quizService.submitAttempt(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizAttemptResult", data.id] });
      queryClient.invalidateQueries({ queryKey: ["quizAttempt", data.id] });
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
    },
  });
}

export function useQuizAttemptResult(attemptId: string, enabled = true) {
  return useQuery({
    queryKey: ["quizAttemptResult", attemptId],
    queryFn: () => quizService.getAttemptResult(attemptId),
    enabled: !!attemptId && enabled,
  });
}
