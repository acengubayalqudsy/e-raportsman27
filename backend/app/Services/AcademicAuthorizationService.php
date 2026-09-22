<?php

namespace App\Services;

use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;

class AcademicAuthorizationService
{
    /**
     * Get list of Class IDs the user is authorized to access.
     * Admin gets all class IDs (or null indicating unrestricted).
     * Guru / Walikelas gets class IDs where they are actively assigned.
     *
     * @param User $user
     * @param int|null $semesterId
     * @return array
     */
    public function getAllowedClassIds(User $user, ?int $semesterId = null): array
    {
        if ($user->hasRole('admin')) {
            return SchoolClass::pluck('id')->toArray();
        }

        $teacher = $user->teacher;
        if (!$teacher) {
            return [];
        }

        // 1. Classes from active Course Assignments
        $courseClassIds = CourseAssignment::where('teacher_id', $teacher->id)
            ->where('status', 'Aktif')
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->pluck('class_id')
            ->toArray();

        // 2. Classes from active Homeroom Assignments
        $homeroomClassIds = HomeroomAssignment::where('teacher_id', $teacher->id)
            ->where('status', 'Aktif')
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->pluck('class_id')
            ->toArray();

        return array_values(array_unique(array_map('intval', array_merge($courseClassIds, $homeroomClassIds))));
    }

    /**
     * Check if user can access a specific student's record.
     *
     * @param User $user
     * @param Student|int $student
     * @param int|null $semesterId
     * @return bool
     */
    public function canAccessStudent(User $user, Student|int $student, ?int $semesterId = null): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$user->hasAnyRole(['guru', 'walikelas'])) {
            return false;
        }

        $studentModel = $student instanceof Student ? $student : Student::find($student);
        if (!$studentModel) {
            return false;
        }

        $allowedClassIds = $this->getAllowedClassIds($user, $semesterId);
        if (empty($allowedClassIds)) {
            return false;
        }

        // Primary check: membership in class_members
        $isMember = ClassMember::where('student_id', $studentModel->id)
            ->whereIn('class_id', $allowedClassIds)
            ->where('status', 'Aktif')
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->exists();

        if ($isMember) {
            return true;
        }

        // Fallback check for transitional compatibility if class_name matches
        if (!empty($studentModel->current_class_name)) {
            $matchingClass = SchoolClass::where('name', $studentModel->current_class_name)
                ->whereIn('id', $allowedClassIds)
                ->exists();
            if ($matchingClass) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can access a specific class.
     *
     * @param User $user
     * @param int $classId
     * @param int|null $semesterId
     * @return bool
     */
    public function canAccessClass(User $user, int $classId, ?int $semesterId = null): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$user->hasAnyRole(['guru', 'walikelas'])) {
            return false;
        }

        $allowedClassIds = $this->getAllowedClassIds($user, $semesterId);
        return in_array((int)$classId, $allowedClassIds, true);
    }

    /**
     * Check if user is the assigned active homeroom teacher of a specific class.
     *
     * @param User $user
     * @param int $classId
     * @param int|null $semesterId
     * @return bool
     */
    public function isHomeroomTeacher(User $user, int $classId, ?int $semesterId = null): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $teacher = $user->teacher;
        if (!$teacher) {
            return false;
        }

        return HomeroomAssignment::where('teacher_id', $teacher->id)
            ->where('class_id', $classId)
            ->where('status', 'Aktif')
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->exists();
    }

    /**
     * Check if user can manage (create/update scores/assessments) for a course assignment.
     */
    public function canManageCourseAssignment(User $user, CourseAssignment|int $assignment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$user->hasRole('guru')) {
            return false;
        }

        $assignmentModel = $assignment instanceof CourseAssignment ? $assignment : CourseAssignment::find($assignment);
        if (!$assignmentModel) {
            return false;
        }

        $teacher = $user->teacher;
        if (!$teacher) {
            return false;
        }

        return (int)$assignmentModel->teacher_id === (int)$teacher->id && $assignmentModel->status === 'Aktif';
    }

    /**
     * Check if user can view grades for a course assignment (Guru pengampu, Wali Kelas, or Admin).
     */
    public function canViewCourseAssignment(User $user, CourseAssignment|int $assignment): bool
    {
        if ($this->canManageCourseAssignment($user, $assignment)) {
            return true;
        }

        $assignmentModel = $assignment instanceof CourseAssignment ? $assignment : CourseAssignment::find($assignment);
        if (!$assignmentModel) {
            return false;
        }

        return $this->isHomeroomTeacher($user, $assignmentModel->class_id, $assignmentModel->semester_id);
    }

    /**
     * Check if user can validate/lock grades for a course assignment (Wali Kelas or Admin).
     */
    public function canValidateCourseGrades(User $user, CourseAssignment|int $assignment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $assignmentModel = $assignment instanceof CourseAssignment ? $assignment : CourseAssignment::find($assignment);
        if (!$assignmentModel) {
            return false;
        }

        return $this->isHomeroomTeacher($user, $assignmentModel->class_id, $assignmentModel->semester_id);
    }

    /**
     * Check if grades for a course assignment are locked.
     */
    public function isCourseGradeLocked(CourseAssignment|int $assignment): bool
    {
        $assignmentId = $assignment instanceof CourseAssignment ? $assignment->id : (int)$assignment;

        return \App\Models\FinalCourseGrade::where('course_assignment_id', $assignmentId)
            ->where('status', 'Terkunci')
            ->exists();
    }
}
