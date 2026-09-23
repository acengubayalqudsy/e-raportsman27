import apiClient from './apiClient.js'

/**
 * Service Layer untuk Penilaian Kurikulum Merdeka E-Raport SMAN 27 Garut.
 * Terhubung dengan endpoint Laravel /api/v1/assessment
 */
export const assessmentService = {
  /**
   * Mengambil konteks penugasan mengajar & wali kelas untuk pengguna aktif.
   */
  async getContext() {
    const res = await apiClient.get('/api/v1/assessment/context')
    if (res.success) {
      return { success: true, data: res.data }
    }
    return {
      success: false,
      error: res.message || 'Gagal memuat konteks penugasan mengajar.',
      data: { assigned_courses: [], active_semester: null, homeroom_class: null },
      status: res.status,
    }
  },

  /**
   * Mengambil daftar Tujuan Pembelajaran (TP).
   */
  async getLearningObjectives(params = {}) {
    const query = new URLSearchParams()
    if (params.subject_id) query.set('subject_id', params.subject_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.grade) query.set('grade', params.grade)

    const res = await apiClient.get(`/api/v1/assessment/learning-objectives?${query.toString()}`)
    if (res.success) {
      return { success: true, data: Array.isArray(res.data) ? res.data : [] }
    }
    return { success: false, error: res.message || 'Gagal memuat Tujuan Pembelajaran.', data: [] }
  },

  /**
   * Membuat instrumen asesmen baru untuk suatu penugasan mengajar.
   */
  async createAssessment(data) {
    const res = await apiClient.post('/api/v1/assessment/assessments', data)
    if (res.success) {
      return { success: true, data: res.data, message: res.message }
    }
    return { success: false, error: res.message || 'Gagal membuat asesmen.', errors: res.errors || {} }
  },

  /**
   * Mengambil gradebook lengkap (siswa, asesmen, skor nilai, nilai akhir, status kunci).
   */
  async getGradebook(courseAssignmentId) {
    const res = await apiClient.get(`/api/v1/assessment/gradebook?course_assignment_id=${courseAssignmentId}`)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return {
      success: false,
      error: res.message || 'Gagal memuat buku nilai.',
      data: { students: [], assessments: [], is_locked: false, course_assignment: null },
    }
  },

  /**
   * Menyimpan nilai siswa secara massal dan transaksional.
   */
  async saveBatchScores(courseAssignmentId, scores) {
    const res = await apiClient.post('/api/v1/assessment/scores/batch', {
      course_assignment_id: courseAssignmentId,
      scores,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data }
    }
    return {
      success: false,
      error: res.message || 'Gagal menyimpan nilai.',
      errors: res.errors || {},
      status: res.status,
    }
  },

  /**
   * Memicu perhitungan nilai akhir & rekomendasi narasi capaian kompetensi.
   */
  async calculateFinalGrades(courseAssignmentId) {
    const res = await apiClient.post('/api/v1/assessment/final-grades/calculate', {
      course_assignment_id: courseAssignmentId,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data }
    }
    return { success: false, error: res.message || 'Gagal menghitung nilai akhir.' }
  },

  /**
   * Memperbarui narasi capaian kompetensi yang diedit manual oleh guru.
   */
  async updateCompetencyAchievements(courseAssignmentId, achievements) {
    const res = await apiClient.put('/api/v1/assessment/competencies/batch', {
      course_assignment_id: courseAssignmentId,
      achievements,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data }
    }
    return { success: false, error: res.message || 'Gagal menyimpan deskripsi kompetensi.' }
  },

  /**
   * Mengambil rekap leger kelas untuk wali kelas / admin.
   */
  async getClassRecap(classId, semesterId) {
    const res = await apiClient.get(`/api/v1/assessment/class-recap?class_id=${classId}&semester_id=${semesterId}`)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return {
      success: false,
      error: res.message || 'Gagal memuat rekap nilai kelas.',
      data: { students: [], subjects: [], class: null, semester: null },
    }
  },

  /**
   * Mengambil status kelengkapan nilai seluruh mapel pada suatu kelas.
   */
  async getValidationStatus(classId, semesterId) {
    const res = await apiClient.get(`/api/v1/assessment/validation-status?class_id=${classId}&semester_id=${semesterId}`)
    if (res.success) {
      return { success: true, data: Array.isArray(res.data) ? res.data : [] }
    }
    return { success: false, error: res.message || 'Gagal memuat status validasi.', data: [] }
  },

  /**
   * Memvalidasi dan mengunci nilai mapel (Wali Kelas / Admin).
   */
  async validateCourse(courseAssignmentId, notes = '') {
    const res = await apiClient.post('/api/v1/assessment/validate-course', {
      course_assignment_id: courseAssignmentId,
      notes,
    })
    if (res.success) {
      return { success: true, message: res.message }
    }
    return { success: false, error: res.message || 'Gagal memvalidasi nilai.' }
  },

  /**
   * Membuka kunci nilai mapel (Wali Kelas / Admin).
   */
  async unlockCourse(courseAssignmentId, reason) {
    const res = await apiClient.post('/api/v1/assessment/unlock-course', {
      course_assignment_id: courseAssignmentId,
      reason,
    })
    if (res.success) {
      return { success: true, message: res.message }
    }
    return { success: false, error: res.message || 'Gagal membuka kunci nilai.' }
  },

  /**
   * Mengambil data Rapor Siswa terintegrasi.
   */
  async getReportCard(studentId, semesterId = null) {
    const query = semesterId ? `?semester_id=${semesterId}` : ''
    const res = await apiClient.get(`/api/v1/assessment/report-card/${studentId}${query}`)
    if (res.success) {
      return { success: true, data: res.data }
    }
    return { success: false, error: res.message || 'Gagal memuat rapor siswa.', data: null }
  },

  /**
   * Mengambil data pelengkap rapor (Absensi, Ekskul, Kokurikuler, Catatan Wali Kelas).
   */
  async getSupplementaryData(classId, semesterId) {
    const res = await apiClient.get(`/api/v1/assessment/supplementary/${classId}/${semesterId}`)
    if (res.success) {
      return { success: true, data: res.data, status: res.status }
    }
    return {
      success: false,
      error: res.message || 'Gagal memuat data pelengkap rapor.',
      data: { students: [] },
      status: res.status,
      errors: res.errors || null,
    }
  },

  /**
   * Menyimpan data presensi/absensi semester siswa secara massal.
   */
  async saveAttendance(classId, semesterId, items) {
    const res = await apiClient.post('/api/v1/assessment/attendance/batch', {
      class_id: classId,
      semester_id: semesterId,
      items,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data, status: res.status }
    }
    return {
      success: false,
      error: res.message || 'Gagal menyimpan data absensi.',
      status: res.status,
      errors: res.errors || null,
    }
  },

  /**
   * Menyimpan data ekstrakurikuler siswa secara massal.
   */
  async saveExtracurriculars(classId, semesterId, items) {
    const res = await apiClient.post('/api/v1/assessment/extracurriculars/batch', {
      class_id: classId,
      semester_id: semesterId,
      items,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data }
    }
    return { success: false, error: res.message || 'Gagal menyimpan data ekstrakurikuler.' }
  },

  /**
   * Menyimpan data catatan kokurikuler siswa secara massal.
   */
  async saveCocurriculars(classId, semesterId, items) {
    const res = await apiClient.post('/api/v1/assessment/cocurriculars/batch', {
      class_id: classId,
      semester_id: semesterId,
      items,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data }
    }
    return { success: false, error: res.message || 'Gagal menyimpan catatan kokurikuler.' }
  },

  /**
   * Menyimpan catatan wali kelas secara massal.
   */
  async saveHomeroomNotes(classId, semesterId, items) {
    const res = await apiClient.post('/api/v1/assessment/homeroom-notes/batch', {
      class_id: classId,
      semester_id: semesterId,
      items,
    })
    if (res.success) {
      return { success: true, message: res.message, data: res.data, status: res.status }
    }
    return {
      success: false,
      error: res.message || 'Gagal menyimpan catatan wali kelas.',
      status: res.status,
      errors: res.errors || null,
    }
  },
}

export default assessmentService
