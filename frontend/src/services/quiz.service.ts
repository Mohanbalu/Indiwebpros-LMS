import { api } from "./api";
import type {
  StartAttemptResponse,
  ResumeAttemptResponse,
  SubmitAttemptPayload,
  QuizAttemptRecord,
  AttemptResultResponse,
  QuizDetail,
} from "@/types/quiz.types";

export const quizService = {
  getQuiz: async (quizId: string): Promise<QuizDetail> => {
    const res = await api.get(`/quizzes/${quizId}`);
    return res.data.data;
  },

  startAttempt: async (quizId: string): Promise<StartAttemptResponse> => {
    const res = await api.post("/quizzes/attempts/start", { quizId });
    return res.data.data;
  },

  resumeAttempt: async (attemptId: string): Promise<ResumeAttemptResponse> => {
    const res = await api.get(`/quizzes/attempts/${attemptId}/resume`);
    return res.data.data;
  },

  submitAttempt: async (payload: SubmitAttemptPayload): Promise<QuizAttemptRecord> => {
    const res = await api.post(`/quizzes/attempts/${payload.attemptId}/submit`, {
      attemptId: payload.attemptId,
      answers: payload.answers,
    });
    return res.data.data;
  },

  getAttemptResult: async (attemptId: string): Promise<AttemptResultResponse> => {
    const res = await api.get(`/quizzes/attempts/${attemptId}/result`);
    return res.data.data;
  },
};
