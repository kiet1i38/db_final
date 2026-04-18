import { Quiz, Question, AnswerOption } from '../types';

/**
 * Normalize backend quiz response to frontend Quiz type
 * Backend returns quizId, questionId, optionId
 * Frontend also accepts id, but uses quizId for consistency with backend
 */
export function normalizeQuiz(data: any): Quiz {
  const quizSource = data?.quiz ?? data;
  const questionsSource =
    quizSource?.questions ??
    quizSource?.questionList ??
    quizSource?.items ??
    [];

  return {
    id: quizSource.quizId || quizSource.id,
    quizId: quizSource.quizId || quizSource.id,
    teacherId: quizSource.teacherId,
    sectionId: quizSource.sectionId,
    title: quizSource.title,
    description: quizSource.description,
    timeLimitMinutes: quizSource.timeLimitMinutes,
    deadlineAt: quizSource.deadlineAt,
    maxAttempts: quizSource.maxAttempts,
    maxScore: quizSource.maxScore,
    status: quizSource.status,
    createdAt: quizSource.createdAt,
    updatedAt: quizSource.updatedAt,
    hiddenReason: quizSource.hiddenReason,
    totalQuestions: quizSource.totalQuestions,
    questionPoints: quizSource.questionPoints,
    questions: Array.isArray(questionsSource)
      ? questionsSource.map(normalizeQuestion)
      : [],
  };
}

export function normalizeQuestion(data: any): Question {
  const questionSource = data?.question ?? data;
  const optionsSource =
    questionSource?.answerOptions ??
    questionSource?.options ??
    questionSource?.answers ??
    [];

  return {
    id: questionSource.questionId || questionSource.id,
    questionId: questionSource.questionId || questionSource.id,
    content: questionSource.content ?? questionSource.questionContent ?? questionSource.text,
    questionType: questionSource.questionType ?? questionSource.type,
    points: questionSource.points,
    answerOptions: Array.isArray(optionsSource)
      ? optionsSource.map(normalizeAnswerOption)
      : [],
  };
}

export function normalizeAnswerOption(data: any): AnswerOption {
  const optionSource = data?.option ?? data;
  return {
    id: optionSource.optionId || optionSource.id,
    optionId: optionSource.optionId || optionSource.id,
    content: optionSource.content ?? optionSource.text ?? optionSource.label,
    isCorrect: optionSource.isCorrect,
  };
}

export function normalizeQuizzes(quizzes: any[]): Quiz[] {
  return quizzes.map(normalizeQuiz);
}
