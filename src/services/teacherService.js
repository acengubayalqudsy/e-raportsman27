import apiClient from './apiClient.js'

/**
 * Service Layer untuk Master Data Guru dan Tenaga Kependidikan.
 * Mengintegrasikan komponen frontend dengan REST API Laravel 12 & MariaDB
 * melalui apiClient berbasis Fetch API bawaan dan Laravel Sanctum cookie authentication.
 */
export const teacherService = {
  /**
   * Mengambil daftar guru dari server dengan paginasi, pencarian, dan filter.
   * @param {Object} params - { page, per_page, search, status, gender, employmentStatus, subject, sort_by, sort_dir }
   */
  async getTeachers(params = {}) {
    const query = new URLSearchParams()

    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) {
      query.set('per_page', params.per_page || params.rowsPerPage)
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim())
    }

    if (params.status && params.status !== 'Semua Status') {
      query.set('status', params.status)
    }
    if (params.gender && params.gender !== 'Semua') {
      query.set('gender', params.gender)
    }
    if (params.employmentStatus && params.employmentStatus !== 'Semua Kepegawaian') {
      query.set('employment_status', params.employmentStatus)
    }
    if (params.subject && params.subject !== 'Semua Mata Pelajaran') {
      query.set('subject', params.subject)
    }
    if (params.type) {
      query.set('type', params.type)
    }
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const queryString = query.toString()
    const endpoint = `/api/v1/master/teachers${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get(endpoint)

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
      error: response.message || 'Gagal memuat data guru.',
      status: response.status,
    }
  },

  /**
   * Mengambil detail satu guru berdasarkan ID dari database.
   */
  async getTeacherById(id) {
    const response = await apiClient.get(`/api/v1/master/teachers/${id}`)
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Data guru tidak ditemukan.',
      status: response.status,
    }
  },

  /**
   * Mengambil statistik ringkasan agregat guru dari database.
   */
  async getTeacherStats() {
    const response = await apiClient.get('/api/v1/master/teachers/stats')
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat statistik guru.',
      status: response.status,
    }
  },

  /**
   * Menambahkan data guru baru ke database melalui REST API.
   */
  async createTeacher(formData) {
    const response = await apiClient.post('/api/v1/master/teachers', formData)

    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }

    // Format pesan error dari validasi HTTP 422
    let errorMsg = response.message || 'Gagal menambahkan data guru.'
    if (response.errors && typeof response.errors === 'object') {
      const fieldErrors = Object.values(response.errors).flat()
      if (fieldErrors.length > 0) {
        errorMsg = fieldErrors[0]
      }
    }

    return {
      success: false,
      error: errorMsg,
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Memperbarui data guru pada database melalui REST API.
   */
  async updateTeacher(id, formData) {
    const response = await apiClient.put(`/api/v1/master/teachers/${id}`, formData)

    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }

    // Format pesan error dari validasi HTTP 422
    let errorMsg = response.message || 'Gagal memperbarui data guru.'
    if (response.errors && typeof response.errors === 'object') {
      const fieldErrors = Object.values(response.errors).flat()
      if (fieldErrors.length > 0) {
        errorMsg = fieldErrors[0]
      }
    }

    return {
      success: false,
      error: errorMsg,
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Menghapus guru menggunakan soft delete pada database.
   */
  async deleteTeacher(id) {
    const response = await apiClient.delete(`/api/v1/master/teachers/${id}`)

    if (response.success) {
      return { success: true, message: response.message }
    }

    return {
      success: false,
      error: response.message || 'Gagal menghapus data guru.',
      status: response.status,
    }
  },
}

export default teacherService
