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

export const userService = {
  /**
   * Mengambil daftar pengguna dengan pagination, search, dan filter role/status.
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.role && params.role !== 'Semua Role') query.set('role', params.role)
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/master-data/users${qs ? `?${qs}` : ''}`)

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
      error: response.message || 'Gagal memuat data pengguna.',
      status: response.status,
    }
  },

  /**
   * Mengambil detail pengguna berdasarkan ID.
   */
  async getUserById(id) {
    const response = await apiClient.get(`/api/v1/master-data/users/${id}`)
    if (response.success) return { success: true, data: response.data }
    return { success: false, error: response.message || 'Pengguna tidak ditemukan.', status: response.status }
  },

  /**
   * Menambahkan pengguna baru dengan multi-role dan password hashing di server.
   */
  async createUser(formData) {
    const payload = {
      name: formData.name,
      username: formData.username || formData.email?.split('@')[0],
      email: formData.email,
      password: formData.password || 'password123',
      phone: formData.phone || null,
      roles: formData.roles || (formData.role ? [formData.role] : ['guru']),
      status: formData.status || 'Aktif',
    }
    const response = await apiClient.post('/api/v1/master-data/users', payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal menambahkan pengguna.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Memperbarui profil pengguna, password (opsional), dan roles.
   */
  async updateUser(id, formData) {
    const payload = {
      name: formData.name,
      username: formData.username || formData.email?.split('@')[0],
      email: formData.email,
      phone: formData.phone,
      roles: formData.roles || (formData.role ? [formData.role] : undefined),
      status: formData.status,
    }
    if (formData.password) {
      payload.password = formData.password
    }
    const response = await apiClient.put(`/api/v1/master-data/users/${id}`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: formatErrorMessage(response, 'Gagal memperbarui pengguna.'),
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Mengubah status aktif/nonaktif akun pengguna (dengan proteksi admin terakhir).
   */
  async toggleStatus(id, status = null) {
    const payload = status ? { status } : {}
    const response = await apiClient.patch(`/api/v1/master-data/users/${id}/status`, payload)
    if (response.success) return { success: true, data: response.data, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal mengubah status pengguna.',
      status: response.status,
    }
  },

  /**
   * Menghapus akun pengguna (dengan proteksi admin terakhir dan integritas akademik).
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/api/v1/master-data/users/${id}`)
    if (response.success) return { success: true, message: response.message }

    return {
      success: false,
      error: response.message || 'Gagal menghapus pengguna.',
      status: response.status,
    }
  },

  /**
   * Mengambil daftar seluruh role sistem untuk pilihan form.
   */
  async getRoles() {
    const response = await apiClient.get('/api/v1/master-data/roles')
    if (response.success) {
      return { success: true, data: Array.isArray(response.data) ? response.data : [] }
    }
    return { success: false, error: response.message || 'Gagal memuat roles.', status: response.status }
  },
}

export default userService
