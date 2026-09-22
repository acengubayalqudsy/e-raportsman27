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

export const religionService = {
  /**
   * Mengambil daftar master agama dengan pagination, search, dan filter status.
   */
  async getReligions(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.all) query.set('all', '1')
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/master-data/religions${qs ? `?${qs}` : ''}`)

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
      error: response.message || 'Gagal memuat data master agama.',
      status: response.status,
    }
  },

  /**
   * Mengambil detail agama berdasarkan ID.
   */
  async getReligionById(id) {
    const response = await apiClient.get(`/api/v1/master-data/religions/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Data agama tidak ditemukan.', status: response.status }
  },

  /**
   * Menambahkan master agama baru.
   */
  async createReligion(formData) {
    const payload = {
      name: formData.name,
      status: formData.status || 'Aktif',
    }
    const response = await apiClient.post('/api/v1/master-data/religions', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan agama baru.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Memperbarui master agama.
   */
  async updateReligion(id, formData) {
    const payload = {
      name: formData.name,
      status: formData.status,
    }
    const response = await apiClient.put(`/api/v1/master-data/religions/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui agama.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Mengubah status aktif/nonaktif agama.
   */
  async toggleStatus(id, status = null) {
    const payload = status ? { status } : {}
    const response = await apiClient.patch(`/api/v1/master-data/religions/${id}/status`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal mengubah status agama.',
      status: response.status,
    }
  },

  /**
   * Menghapus master agama.
   */
  async deleteReligion(id) {
    const response = await apiClient.delete(`/api/v1/master-data/religions/${id}`)
    if (response.success) return { success: true, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal menghapus agama.',
      status: response.status,
    }
  },
}

export default religionService
