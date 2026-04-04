import { IQuizRepository } from "../../domain/interface-repositories/IQuizRepository";
import { IEventPublisher } from "../interfaces/IEventPublisher";
import { QuizDeleted } from "../../domain/events/QuizDeleted";

// Teacher xóa quiz (chỉ DRAFT hoặc HIDDEN được phép xóa).
//
// Flow:
//   1. Load quiz, kiểm tra tồn tại
//   2. Kiểm tra Teacher là owner
//   3. Kiểm tra status (chỉ DRAFT hoặc HIDDEN mới xóa được)
//   4. Delete quiz từ repository
//   5. Publish QuizDeleted event
//   6. Không trả về gì (204 No Content)

export class DeleteQuizUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    teacherId: string,
    quizId: string
  ): Promise<void> {
    // Bước 1: load quiz
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error(`NotFoundError: Quiz "${quizId}" không tồn tại.`);
    }

    // Bước 2: ownership check
    if (quiz.teacherId !== teacherId) {
      throw new Error(
        "AccessDeniedError: Bạn không có quyền xóa quiz này."
      );
    }

    // Bước 3: chỉ DRAFT hoặc HIDDEN mới xóa được
    if (quiz.status !== "Draft" && quiz.status !== "Hidden") {
      throw new Error(
        `DomainError: Chỉ có thể xóa quiz ở trạng thái Draft hoặc Hidden (hiện tại: "${quiz.status}").`
      );
    }

    // Bước 4: delete từ repository
    await this.quizRepository.delete(quizId);

    // Bước 5: publish event
    await this.eventPublisher.publish(
      new QuizDeleted(quizId, teacherId, quiz.sectionId)
    );
  }
}
