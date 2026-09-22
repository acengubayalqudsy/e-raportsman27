import apiClient from './apiClient.js'

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

function parseTeacherId(val) {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isInteger(num) && num > 0 ? num : null
}

export const extracurricularService = {
  /**
   * Mengambil daftar master ekstrakurikuler dengan pagination, search, dan filter status.
   */
  async getExtracurriculars(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.all) query.set('all', '1')
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/master-data/extracurriculars${qs ? `?${qs}` : ''}`)

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
      error: response.message || 'Gagal memuat data master ekstrakurikuler.',
      status: response.status,
    }
  },

  /**
   * Mengambil detail ekstrakurikuler berdasarkan ID.
   */
  async getExtracurricularById(id) {
    const response = await apiClient.get(`/api/v1/master-data/extracurriculars/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Data ekstrakurikuler tidak ditemukan.', status: response.status }
  },

  /**
   * Menambahkan master ekstrakurikuler baru.
   */
  async createExtracurricular(formData) {
    const payload = {
      code: formData.code,
      name: formData.name,
      teacher_id: parseTeacherId(formData.teacher_id ?? formData.teacherId),
      description: formData.description || null,
      status: formData.status || 'Aktif',
    }
    const response = await apiClient.post('/api/v1/master-data/extracurriculars', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan ekstrakurikuler baru.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Memperbarui master ekstrakurikuler.
   */
  async updateExtracurricular(id, formData) {
    const payload = {
      code: formData.code,
      name: formData.name,
      teacher_id: parseTeacherId(formData.teacher_id ?? formData.teacherId),
      description: formData.description ?? null,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/master-data/extracurriculars/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui ekstrakurikuler.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Mengubah status aktif/nonaktif ekstrakurikuler.
   */
  async toggleStatus(id, status = null) {
    const payload = status ? { status } : {}
    const response = await apiClient.patch(`/api/v1/master-data/extracurriculars/${id}/status`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal mengubah status ekstrakurikuler.',
      status: response.status,
    }
  },

  /**
   * Menghapus master ekstrakurikuler.
   */
  async deleteExtracurricular(id) {
    const response = await apiClient.delete(`/api/v1/master-data/extracurriculars/${id}`)
    if (response.success) return { success: true, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal menghapus ekstrakurikuler.',
      status: response.status,
    }
  },
}

export default extracurricularService
