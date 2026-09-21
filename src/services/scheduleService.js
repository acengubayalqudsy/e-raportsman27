import apiClient from './apiClient.js'

/**
 * Service Layer untuk Jadwal Mengajar (Schedules).
 * Terhubung dengan API Laravel 11 /api/v1/schedules
 */

export const scheduleService = {
  /**
   * Mengambil daftar jadwal dengan paginasi, pencarian, dan filter relasi.
   */
  async getSchedules(params = {}) {
    const query = new URLSearchParams()

    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.class_id && params.class_id !== 'Semua') query.set('class_id', params.class_id)
    if (params.teacher_id && params.teacher_id !== 'Semua') query.set('teacher_id', params.teacher_id)
    if (params.room_id && params.room_id !== 'Semua') query.set('room_id', params.room_id)
    if (params.subject_id && params.subject_id !== 'Semua') query.set('subject_id', params.subject_id)
    if (params.day_of_week && params.day_of_week !== 'Semua') query.set('day_of_week', params.day_of_week)
    if (params.status && params.status !== 'Semua') query.set('status', params.status)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const queryString = query.toString()
    const endpoint = `/api/v1/schedules${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get(endpoint)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 15,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      error: response.message || 'Gagal memuat daftar jadwal mengajar.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengambil detail jadwal berdasarkan ID.
   */
  async getSchedule(id) {
    const response = await apiClient.get(`/api/v1/schedules/${id}`)
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat detail jadwal.',
      status: response.status,
    }
  },

  /**
   * Menambahkan jadwal mengajar baru.
   */
  async createSchedule(data) {
    const response = await apiClient.post('/api/v1/schedules', data)
    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal menyimpan jadwal mengajar.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengubah jadwal mengajar.
   */
  async updateSchedule(id, data) {
    const response = await apiClient.put(`/api/v1/schedules/${id}`, data)
    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal memperbarui jadwal mengajar.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Menghapus jadwal mengajar (soft delete).
   */
  async deleteSchedule(id) {
    const response = await apiClient.delete(`/api/v1/schedules/${id}`)
    if (response.success) {
      return { success: true, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal menghapus jadwal.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengambil master data opsi untuk dropdown form jadwal (tahun, semester, rombel, mapel, guru, ruangan, penugasan).
   */
  async getOptions(params = {}) {
    const query = new URLSearchParams()
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)

    const queryString = query.toString()
    const endpoint = `/api/v1/schedules/options${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get(endpoint)
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat opsi referensi jadwal.',
      status: response.status,
    }
  },
}

export default scheduleService
