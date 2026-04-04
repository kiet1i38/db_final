import { api } from '../../shared/services/api';
import { QuizAttempt, SubmitAttemptRequest } from '../../shared/types';

export const attemptService = {
  async startAttempt(quizId: string): Promise<QuizAttempt> {
    const response = await api.post<QuizAttempt>(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  async submitAttempt(attemptId: string, data: SubmitAttemptRequest): Promise<QuizAttempt> {
    const response = await api.post<QuizAttempt>(`/attempts/${attemptId}/submit`, data);
    return response.data;
  },

  async expireAttempt(attemptId: string): Promise<QuizAttempt> {
    const response = await api.post<QuizAttempt>(`/attempts/${attemptId}/expire`);
    return response.data;
  },
};
