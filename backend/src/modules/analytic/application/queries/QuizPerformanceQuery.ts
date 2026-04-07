import { IOracleAnalyticsRepository } from "../../domain/interface-repositories/IOracleAnalyticsRepository";
import { IAcademicQueryService }      from "../../../academic";
import { IAnalyticCache, AnalyticCacheKey, AnalyticsCacheTTL } from "../../domain/interface-repositories/IAnalyticCache";
import { QuizPerformanceView }        from "../../domain/read-models/QuizPerformanceView";
import { QuizPerformanceDTO }         from "../dtos/QuizPerformanceDTO";

// Actor:   Teacher
// Permission: VIEW_ANALYTICS
//
// Authorization by data áp dụng cho cả 2 method:
//   Teacher chỉ được xem analytics của section mình dạy.
//   Business Rule: "Teacher Can Only Manage Sections They Are Assigned To"
export class QuizPerformanceQuery {
  constructor(
    private readonly oracleRepo:      IOracleAnalyticsRepository,
    private readonly academicService: IAcademicQueryService,
    private readonly mongoModel:      any, // StudentQuizAnswerModel
    private readonly cache:           IAnalyticCache,
  ) {}

  // GET /analytics/sections/:sectionId/quizzes/:quizId/performance
  // → QuizPerformanceDTO | null
  // null = chưa có attempt nào submitted cho quiz này.
  async byQuiz(
    teacherId: string,
    quizId:    string,
    sectionId: string,
  ): Promise<QuizPerformanceDTO | null> {
    await this.assertTeacherAssigned(teacherId, sectionId);
 
    const key    = AnalyticCacheKey.quizPerformance(quizId, sectionId);
    const cached = await this.cache.get<QuizPerformanceDTO>(key);
    if (cached) return cached;
 
    const view = await this.oracleRepo.findQuizPerformance(quizId, sectionId);
    const dto  = view ? this.toDTO(view) : null;
    if (dto) await this.cache.set(key, dto, AnalyticsCacheTTL.NORMAL);
    return dto;
  }

  // GET /analytics/sections/:sectionId/performance
  // → QuizPerformanceDTO[]
  // [] = section chưa có quiz nào được attempt.
  async bySection(
    teacherId: string,
    sectionId: string,
  ): Promise<QuizPerformanceDTO[]> {
    console.log('[QuizPerformanceQuery.bySection] ENTRY: teacherId=', teacherId, 'sectionId=', sectionId);

    await this.assertTeacherAssigned(teacherId, sectionId);

    const key    = AnalyticCacheKey.sectionPerformance(sectionId);
    console.log('[QuizPerformanceQuery.bySection] Cache key:', key);

    const cached = await this.cache.get<QuizPerformanceDTO[]>(key);
    if (cached && cached.length > 0) {
      console.log('[QuizPerformanceQuery.bySection] Cache HIT:', cached.length, 'quizzes');
      console.log('[QuizPerformanceQuery.bySection] Cached quizzes:', JSON.stringify(cached, null, 2));
      return cached;
    }
    console.log('[QuizPerformanceQuery.bySection] Cache MISS or empty');

    try {
      // Query MongoDB directly - much more reliable than Oracle with projection issues
      console.log('[QuizPerformanceQuery.bySection] Querying MongoDB for sectionId=', sectionId);
      const mongoData = await this.mongoModel
        .find({ sectionId })
        .lean()
        .exec();

      console.log('[QuizPerformanceQuery.bySection] MongoDB returned:', mongoData?.length || 0, 'attempts');
      if (mongoData && mongoData.length > 0) {
        console.log('[QuizPerformanceQuery.bySection] First attempt:', JSON.stringify(mongoData[0], null, 2));
      }

      if (mongoData && mongoData.length > 0) {
        // Group by quizId and calculate metrics
        const quizMap = new Map<string, any>();

        for (const attempt of mongoData) {
          if (!quizMap.has(attempt.quizId)) {
            quizMap.set(attempt.quizId, {
              quizId: attempt.quizId,
              quizTitle: attempt.quizTitle || 'Untitled Quiz',
              sectionId: attempt.sectionId,
              attempts: [],
              uniqueStudents: new Set<string>(),
            });
          }

          const quiz = quizMap.get(attempt.quizId)!;
          quiz.attempts.push({
            score: attempt.score || 0,
            maxScore: attempt.maxScore || 100,
            studentId: attempt.studentId,
          });
          quiz.uniqueStudents.add(attempt.studentId);
        }

        console.log('[QuizPerformanceQuery.bySection] Grouped into', quizMap.size, 'quizzes');

        // Convert to DTOs
        const dtos: QuizPerformanceDTO[] = Array.from(quizMap.values()).map((quiz: any) => {
          const totalAttempts = quiz.attempts.length;
          const attemptedStudents = quiz.uniqueStudents.size;
          const avgScore = quiz.attempts.length > 0
            ? quiz.attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / quiz.attempts.length
            : 0;
          const highestScore = Math.max(...quiz.attempts.map((a: any) => a.score || 0));
          const lowestScore = Math.min(...quiz.attempts.map((a: any) => a.score || 0));

          console.log('[QuizPerformanceQuery.bySection] Quiz', quiz.quizId, ':', {
            title: quiz.quizTitle,
            totalAttempts,
            attemptedStudents,
            avgScore,
            highestScore,
            lowestScore,
          });

          return {
            quizId: quiz.quizId,
            sectionId: quiz.sectionId,
            quizTitle: quiz.quizTitle,
            sectionName: sectionId, // placeholder
            totalAttempts,
            attemptedStudents,
            totalStudents: attemptedStudents, // estimate
            averageScore: avgScore,
            highestScore: isFinite(highestScore) ? highestScore : 0,
            lowestScore: isFinite(lowestScore) ? lowestScore : 0,
            completionRate: attemptedStudents > 0 ? attemptedStudents / attemptedStudents : 0,
            lastUpdatedAt: new Date().toISOString(),
          };
        });

        console.log('[QuizPerformanceQuery.bySection] Converted to', dtos.length, 'DTOs');
        await this.cache.set(key, dtos, AnalyticsCacheTTL.NORMAL);
        console.log('[QuizPerformanceQuery.bySection] Cached', dtos.length, 'DTOs');
        return dtos;
      }
    } catch (err) {
      console.warn('[QuizPerformanceQuery.bySection] MongoDB query failed:', err instanceof Error ? err.message : err);
    }

    try {
      console.log('[QuizPerformanceQuery.bySection] Falling back to Oracle...');
      const views = await this.oracleRepo.findQuizPerformanceBySection(sectionId);
      console.log('[QuizPerformanceQuery.bySection] Oracle query returned:', views?.length || 0, 'results');
      const dtos  = views.map((view) => this.toDTO(view));
      await this.cache.set(key, dtos, AnalyticsCacheTTL.NORMAL);
      console.log('[QuizPerformanceQuery.bySection] Cached', dtos.length, 'DTOs from Oracle');
      return dtos;
    } catch (err) {
      console.error('[QuizPerformanceQuery.bySection] Oracle query FAILED:', err instanceof Error ? err.message : err);
      throw err;
    }
  }

  // private helpers 
  private async assertTeacherAssigned(teacherId: string, sectionId: string): Promise<void> {
    const ok = await this.academicService.isTeacherAssignedToSection(teacherId, sectionId);
    if (!ok) throw new Error(
      `AccessDeniedError: Teacher không được phép xem analytics của section "${sectionId}".`,
    );
  }
 
  // QuizPerformanceView (domain) → QuizPerformanceDTO (application)
  private toDTO(view: QuizPerformanceView): QuizPerformanceDTO {
    return {
      quizId:            view.quizId,
      sectionId:         view.sectionId,
      quizTitle:         view.quizTitle,
      sectionName:       view.sectionName,
      totalAttempts:     view.totalAttempts,
      attemptedStudents: view.attemptedStudents,
      totalStudents:     view.totalStudents,
      averageScore:      view.averageScore,
      highestScore:      view.highestScore,
      lowestScore:       view.lowestScore,
      completionRate:    view.completionRate,
      lastUpdatedAt:     view.lastUpdatedAt.toISOString(),
    };
  }
}