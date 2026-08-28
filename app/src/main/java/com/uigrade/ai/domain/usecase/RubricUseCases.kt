package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AssignmentRepository
import com.uigrade.ai.domain.repository.AuthRepository
import com.uigrade.ai.domain.repository.RubricRepository
import java.util.UUID
import javax.inject.Inject

class GetRubricByIdUseCase @Inject constructor(
    private val repository: RubricRepository
) {
    suspend operator fun invoke(id: String): Rubric? =
        repository.getRubricById(id)
}

class GetAllRubricsUseCase @Inject constructor(
    private val repository: RubricRepository
) {
    suspend operator fun invoke(): List<Rubric> =
        repository.getAllRubrics()
}

class CreateRubricUseCase @Inject constructor(
    private val repository: RubricRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(rubric: Rubric): Result<Rubric> {
        validateRubric(rubric).exceptionOrNull()?.let { return Result.failure(it) }
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        if (user.role != UserRole.LECTURER) {
            return Result.failure(IllegalArgumentException("Chỉ giảng viên mới có thể tạo rubric"))
        }
        return runCatching {
            repository.createRubric(
                rubric.copy(
                    id = rubric.id.ifBlank { UUID.randomUUID().toString() },
                    lecturerId = user.id,
                    totalMaxScore = rubric.criteria.sumOf { it.maxScore }
                )
            )
        }
    }
}

class UpdateRubricUseCase @Inject constructor(
    private val repository: RubricRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(rubric: Rubric): Result<Rubric> {
        validateRubric(rubric).exceptionOrNull()?.let { return Result.failure(it) }
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val existing = repository.getRubricById(rubric.id)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy rubric"))
        if (user.role != UserRole.LECTURER || (existing.lecturerId.isNotBlank() && existing.lecturerId != user.id)) {
            return Result.failure(IllegalArgumentException("Bạn không có quyền chỉnh sửa rubric này"))
        }
        return runCatching {
            repository.updateRubric(
                rubric.copy(
                    lecturerId = existing.lecturerId.ifBlank { user.id },
                    totalMaxScore = rubric.criteria.sumOf { it.maxScore }
                )
            )
        }
    }
}

class DeleteRubricUseCase @Inject constructor(
    private val repository: RubricRepository,
    private val assignmentRepository: AssignmentRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(rubricId: String): Result<Unit> {
        val user = authRepository.getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val rubric = repository.getRubricById(rubricId)
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy rubric"))
        if (user.role != UserRole.LECTURER || (rubric.lecturerId.isNotBlank() && rubric.lecturerId != user.id)) {
            return Result.failure(IllegalArgumentException("Bạn không có quyền xóa rubric này"))
        }
        if (assignmentRepository.getAllAssignments().any { it.rubricId == rubricId }) {
            return Result.failure(IllegalStateException("Rubric đang được dùng bởi bài tập nên không thể xóa"))
        }
        return if (repository.deleteRubric(rubricId)) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy rubric"))
    }
}

private fun validateRubric(rubric: Rubric): Result<Unit> {
    if (rubric.title.isBlank()) return Result.failure(IllegalArgumentException("Vui lòng nhập tên rubric."))
    if (rubric.criteria.isEmpty()) return Result.failure(IllegalArgumentException("Rubric cần có ít nhất một tiêu chí."))
    if (rubric.criteria.any { it.name.isBlank() }) {
        return Result.failure(IllegalArgumentException("Tên tiêu chí không được để trống."))
    }
    if (rubric.criteria.any { it.maxScore <= 0 }) {
        return Result.failure(IllegalArgumentException("Điểm tiêu chí phải lớn hơn 0."))
    }
    if (rubric.criteria.flatMap { it.levels }.any { it.score < 0 }) {
        return Result.failure(IllegalArgumentException("Điểm mức đánh giá không được âm."))
    }
    val total = rubric.criteria.sumOf { it.maxScore }
    if (rubric.totalMaxScore != total) {
        return Result.failure(IllegalArgumentException("Tổng điểm rubric phải bằng tổng điểm các tiêu chí ($total)."))
    }
    return Result.success(Unit)
}
