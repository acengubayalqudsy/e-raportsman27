import apiClient from './apiClient.js'

/**
 * Service Layer untuk Penugasan Akademik Fase 5B:
 * - Penugasan Wali Kelas per Semester (homeroom_assignments)
 * - Penugasan Guru Mengajar per Mapel, Rombel, dan Semester (course_assignments)
 * - Mengintegrasikan validasi aturan bisnis:
 *   - Satu kelas hanya memiliki 1 wali kelas aktif per semester
 *   - Satu guru tidak boleh menjadi wali kelas di 2 kelas berbeda pada semester yang sama
 *   - Satu rombel/mapel/semester hanya memiliki 1 guru 'Utama'
 */

function formatErrorMessage(response, defaultMsg) {
  let errorMsg = response.message || defaultMsg
  if (response.errors && typeof response.errors === 'object') {
    const fieldErrors = Object.values(response.errors).flat()
    if (fieldErrors.length > 0) {
      errorMsg = fieldErrors[0]
    }
  }
  return errorMsg
}

export const assignmentService = {
  // =========================================================================
  // 1. PENUGASAN WALI KELAS (HOMEROOM)
  // =========================================================================
  async getHomerooms(params = {}) {
    const query = new URLSearchParams()
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.class_id) query.set('class_id', params.class_id)
    if (params.teacher_id) query.set('teacher_id', params.teacher_id)
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.page) query.set('page', params.page)
    if (params.per_page) query.set('per_page', params.per_page)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/homeroom/assignments${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat data wali kelas.'),
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    }
  },

  async assignHomeroom(payload) {
    const response = await apiClient.post('/api/v1/academic/homeroom/assignments', payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Wali kelas berhasil ditugaskan.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal menugaskan wali kelas.'),
      errors: response.errors,
    }
  },

  async updateHomeroom(id, payload) {
    const response = await apiClient.put(`/api/v1/academic/homeroom/assignments/${id}`, payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Penugasan wali kelas berhasil diperbarui.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memperbarui penugasan wali kelas.'),
      errors: response.errors,
    }
  },

  async deleteHomeroom(id) {
    const response = await apiClient.delete(`/api/v1/academic/homeroom/assignments/${id}`)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Penugasan wali kelas berhasil dihapus.',
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal menghapus penugasan wali kelas.'),
    }
  },

  async getHomeroomStats(params = {}) {
    const query = new URLSearchParams()
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/homeroom/stats${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: response.data || {},
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat statistik wali kelas.'),
      data: {},
    }
  },

  // =========================================================================
  // 2. PENUGASAN MENGAJAR GURU (COURSE ASSIGNMENT)
  // =========================================================================
  async getCourseAssignments(params = {}) {
    const query = new URLSearchParams()
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.class_id) query.set('class_id', params.class_id)
    if (params.subject_id) query.set('subject_id', params.subject_id)
    if (params.teacher_id) query.set('teacher_id', params.teacher_id)
    if (params.role && params.role !== 'Semua Peran') query.set('role', params.role)
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.page) query.set('page', params.page)
    if (params.per_page) query.set('per_page', params.per_page)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/course-assignments${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat daftar penugasan mengajar.'),
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    }
  },

  async assignCourse(payload) {
    const response = await apiClient.post('/api/v1/academic/course-assignments', payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Penugasan mengajar berhasil ditambahkan.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal menambahkan penugasan mengajar.'),
      errors: response.errors,
    }
  },

  async updateCourseAssignment(id, payload) {
    const response = await apiClient.put(`/api/v1/academic/course-assignments/${id}`, payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Penugasan mengajar berhasil diperbarui.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memperbarui penugasan mengajar.'),
      errors: response.errors,
    }
  },

  async deleteCourseAssignment(id) {
    const response = await apiClient.delete(`/api/v1/academic/course-assignments/${id}`)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Penugasan mengajar berhasil dihapus.',
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal menghapus penugasan mengajar.'),
    }
  },

  async getCourseAssignmentStats(params = {}) {
    const query = new URLSearchParams()
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/course-assignments/stats${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: response.data || {},
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat statistik penugasan guru.'),
      data: {},
    }
  },
}

export default assignmentService
