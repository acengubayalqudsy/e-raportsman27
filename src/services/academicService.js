import apiClient from './apiClient.js'

/**
 * Service Layer untuk Master Data Fondasi Akademik Fase 5A:
 * - Tahun Ajaran (academic_years)
 * - Semester (semesters)
 * - Data Kelas / Rombel Referensi (classes)
 * - Mata Pelajaran (subjects)
 *
 * Mengintegrasikan frontend React 19 dengan REST API Laravel 12 & MariaDB
 * melalui apiClient berbasis Fetch API bawaan dan Laravel Sanctum cookie authentication.
 */

const ACADEMIC_KEYS = ['tahun-ajaran', 'semester', 'kelas', 'mata-pelajaran']

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

export const academicService = {
  /**
   * Menentukan apakah key referensi termasuk dalam lingkup Master Akademik Fase 5A
   */
  isAcademicKey(key) {
    return ACADEMIC_KEYS.includes(key)
  },

  // =========================================================================
  // 1. TAHUN AJARAN
  // =========================================================================
  async getAcademicYears(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/years${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 8,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      error: response.message || 'Gagal memuat data tahun ajaran dari server.',
      status: response.status,
    }
  },

  async getAcademicYearById(id) {
    const response = await apiClient.get(`/api/v1/academic/years/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Tahun ajaran tidak ditemukan.', status: response.status }
  },

  async createAcademicYear(formData) {
    const payload = {
      name: formData.name,
      start_date: formData.startDate || formData.start_date,
      end_date: formData.endDate || formData.end_date,
      status: formData.status,
    }
    const response = await apiClient.post('/api/v1/academic/years', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan tahun ajaran.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async updateAcademicYear(id, formData) {
    const payload = {
      name: formData.name,
      start_date: formData.startDate || formData.start_date,
      end_date: formData.endDate || formData.end_date,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/academic/years/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui tahun ajaran.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async deleteAcademicYear(id) {
    const response = await apiClient.delete(`/api/v1/academic/years/${id}`)
    if (response.success) return { success: true, message: response.message }
    return { success: false, error: response.message || 'Gagal menghapus tahun ajaran.', status: response.status }
  },

  async activateAcademicYear(id) {
    const response = await apiClient.post(`/api/v1/academic/years/${id}/activate`)
    if (response.success) return { success: true, message: response.message, data: response.data }
    return { success: false, error: response.message || 'Gagal mengaktifkan tahun ajaran.', status: response.status }
  },

  // =========================================================================
  // 2. SEMESTER
  // =========================================================================
  async getSemesters(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.academicYear && params.academicYear !== 'Semua Tahun') query.set('academic_year', params.academicYear)
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/semesters${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 8,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      error: response.message || 'Gagal memuat data semester dari server.',
      status: response.status,
    }
  },

  async getSemesterById(id) {
    const response = await apiClient.get(`/api/v1/academic/semesters/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Semester tidak ditemukan.', status: response.status }
  },

  async createSemester(formData) {
    const payload = {
      academic_year_id: formData.academic_year_id,
      academicYear: formData.academicYear,
      name: formData.name,
      start_date: formData.startDate || formData.start_date,
      end_date: formData.endDate || formData.end_date,
      status: formData.status,
    }
    const response = await apiClient.post('/api/v1/academic/semesters', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan semester.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async updateSemester(id, formData) {
    const payload = {
      academic_year_id: formData.academic_year_id,
      academicYear: formData.academicYear,
      name: formData.name,
      start_date: formData.startDate || formData.start_date,
      end_date: formData.endDate || formData.end_date,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/academic/semesters/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui semester.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async deleteSemester(id) {
    const response = await apiClient.delete(`/api/v1/academic/semesters/${id}`)
    if (response.success) return { success: true, message: response.message }
    return { success: false, error: response.message || 'Gagal menghapus semester.', status: response.status }
  },

  async activateSemester(id) {
    const response = await apiClient.post(`/api/v1/academic/semesters/${id}/activate`)
    if (response.success) return { success: true, message: response.message, data: response.data }
    return { success: false, error: response.message || 'Gagal mengaktifkan semester.', status: response.status }
  },

  // =========================================================================
  // 3. KELAS / ROMBEL REFERENSI
  // =========================================================================
  async getClasses(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.grade && params.grade !== 'Semua Tingkat') query.set('grade', params.grade)
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/classes${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 8,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      error: response.message || 'Gagal memuat data kelas dari server.',
      status: response.status,
    }
  },

  async getClassById(id) {
    const response = await apiClient.get(`/api/v1/academic/classes/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Data kelas tidak ditemukan.', status: response.status }
  },

  async createClass(formData) {
    const payload = {
      academic_year_id: formData.academic_year_id,
      code: formData.code,
      name: formData.name,
      grade: formData.grade,
      capacity: formData.capacity,
      status: formData.status,
    }
    const response = await apiClient.post('/api/v1/academic/classes', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan data kelas.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async updateClass(id, formData) {
    const payload = {
      academic_year_id: formData.academic_year_id,
      code: formData.code,
      name: formData.name,
      grade: formData.grade,
      capacity: formData.capacity,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/academic/classes/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui data kelas.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async deleteClass(id) {
    const response = await apiClient.delete(`/api/v1/academic/classes/${id}`)
    if (response.success) return { success: true, message: response.message }
    return { success: false, error: response.message || 'Gagal menghapus kelas.', status: response.status }
  },

  // =========================================================================
  // 4. MATA PELAJARAN
  // =========================================================================
  async getSubjects(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.group && params.group !== 'Semua Kelompok') query.set('group', params.group)
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/subjects${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 8,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      error: response.message || 'Gagal memuat mata pelajaran dari server.',
      status: response.status,
    }
  },

  async getSubjectById(id) {
    const response = await apiClient.get(`/api/v1/academic/subjects/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Mata pelajaran tidak ditemukan.', status: response.status }
  },

  async createSubject(formData) {
    const payload = {
      code: formData.code,
      name: formData.name,
      group: formData.group,
      grades: formData.grades,
      weekly_hours: formData.weeklyHours || formData.weekly_hours,
      status: formData.status,
    }
    const response = await apiClient.post('/api/v1/academic/subjects', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan mata pelajaran.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async updateSubject(id, formData) {
    const payload = {
      code: formData.code,
      name: formData.name,
      group: formData.group,
      grades: formData.grades,
      weekly_hours: formData.weeklyHours || formData.weekly_hours,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/academic/subjects/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui mata pelajaran.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  async deleteSubject(id) {
    const response = await apiClient.delete(`/api/v1/academic/subjects/${id}`)
    if (response.success) return { success: true, message: response.message }
    return { success: false, error: response.message || 'Gagal menghapus mata pelajaran.', status: response.status }
  },

  // =========================================================================
  // 5. UNIFIED DISPATCHER FOR MasterReferenceView
  // =========================================================================
  async getItems(key, params = {}) {
    switch (key) {
      case 'tahun-ajaran':
        return this.getAcademicYears(params)
      case 'semester':
        return this.getSemesters(params)
      case 'kelas':
        return this.getClasses(params)
      case 'mata-pelajaran':
        return this.getSubjects(params)
      default:
        return { success: false, error: `Key referensi '${key}' tidak dikenali.` }
    }
  },

  async createItem(key, formData) {
    switch (key) {
      case 'tahun-ajaran':
        return this.createAcademicYear(formData)
      case 'semester':
        return this.createSemester(formData)
      case 'kelas':
        return this.createClass(formData)
      case 'mata-pelajaran':
        return this.createSubject(formData)
      default:
        return { success: false, error: `Key referensi '${key}' tidak dikenali.` }
    }
  },

  async updateItem(key, id, formData) {
    switch (key) {
      case 'tahun-ajaran':
        return this.updateAcademicYear(id, formData)
      case 'semester':
        return this.updateSemester(id, formData)
      case 'kelas':
        return this.updateClass(id, formData)
      case 'mata-pelajaran':
        return this.updateSubject(id, formData)
      default:
        return { success: false, error: `Key referensi '${key}' tidak dikenali.` }
    }
  },

  async deleteItem(key, id) {
    switch (key) {
      case 'tahun-ajaran':
        return this.deleteAcademicYear(id)
      case 'semester':
        return this.deleteSemester(id)
      case 'kelas':
        return this.deleteClass(id)
      case 'mata-pelajaran':
        return this.deleteSubject(id)
      default:
        return { success: false, error: `Key referensi '${key}' tidak dikenali.` }
    }
  },

  async activatePeriod(key, id) {
    switch (key) {
      case 'tahun-ajaran':
        return this.activateAcademicYear(id)
      case 'semester':
        return this.activateSemester(id)
      default:
        return { success: false, error: `Aktivasi periode tidak didukung untuk '${key}'.` }
    }
  },
}

export default academicService
