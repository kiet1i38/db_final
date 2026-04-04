import { Quiz, Question, AnswerOption } from '../types';

/**
 * Normalize backend quiz response to frontend Quiz type
 * Backend returns quizId, questionId, optionId
 * Frontend also accepts id, but uses quizId for consistency with backend
 */
export function normalizeQuiz(data: any): Quiz {
  return {
    id: data.quizId || data.id,         // Use quizId if available, fallback to id
    quizId: data.quizId || data.id,
    teacherId: data.teacherId,
    sectionId: data.sectionId,
    title: data.title,
    description: data.description,
    timeLimitMinutes: data.timeLimitMinutes,
    deadlineAt: data.deadlineAt,
    maxAttempts: data.maxAttempts,
    maxScore: data.maxScore,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    hiddenReason: data.hiddenReason,
    totalQuestions: data.totalQuestions,
    questionPoints: data.questionPoints,
    questions: Array.isArray(data.questions)
      ? data.questions.map(normalizeQuestion)
      : [],
  };
}

export function normalizeQuestion(data: any): Question {
  return {
    id: data.questionId || data.id,
    questionId: data.questionId || data.id,
    content: data.content,
    questionType: data.questionType,
    points: data.points,
    answerOptions: Array.isArray(data.answerOptions)
      ? data.answerOptions.map(normalizeAnswerOption)
      : [],
  };
}

export function normalizeAnswerOption(data: any): AnswerOption {
  return {
    id: data.optionId || data.id,
    optionId: data.optionId || data.id,
    content: data.content,
    isCorrect: data.isCorrect,
  };
}

export function normalizeQuizzes(quizzes: any[]): Quiz[] {
  return quizzes.map(normalizeQuiz);
}
