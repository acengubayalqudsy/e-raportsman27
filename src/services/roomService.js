import apiClient from './apiClient.js'

/**
 * Service Layer untuk Master Data Ruangan.
 * Terhubung dengan API Laravel 11 /api/v1/rooms
 */

export const roomService = {
  /**
   * Mengambil daftar ruangan dengan paginasi, pencarian, dan filter.
   */
  async getRooms(params = {}) {
    const query = new URLSearchParams()

    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.room_type && params.room_type !== 'Semua') query.set('room_type', params.room_type)
    if (params.status && params.status !== 'Semua') query.set('status', params.status)
    if (params.building && params.building !== 'Semua') query.set('building', params.building)
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const queryString = query.toString()
    const endpoint = `/api/v1/rooms${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get(endpoint)

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
      error: response.message || 'Gagal memuat data ruangan.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengambil detail ruangan berdasarkan ID.
   */
  async getRoom(id) {
    const response = await apiClient.get(`/api/v1/rooms/${id}`)
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat detail ruangan.',
      status: response.status,
    }
  },

  /**
   * Menambahkan ruangan baru.
   */
  async createRoom(data) {
    const response = await apiClient.post('/api/v1/rooms', data)
    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal menambahkan ruangan.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengubah data ruangan.
   */
  async updateRoom(id, data) {
    const response = await apiClient.put(`/api/v1/rooms/${id}`, data)
    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal memperbarui data ruangan.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Menghapus ruangan (soft delete).
   */
  async deleteRoom(id) {
    const response = await apiClient.delete(`/api/v1/rooms/${id}`)
    if (response.success) {
      return { success: true, message: response.message }
    }
    return {
      success: false,
      error: response.message || 'Gagal menghapus ruangan.',
      errors: response.errors || {},
      status: response.status,
    }
  },

  /**
   * Mengambil statistik ruangan.
   */
  async getStats() {
    const response = await apiClient.get('/api/v1/rooms/stats')
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat statistik ruangan.',
      status: response.status,
    }
  },

  /**
   * Mengambil opsi ruangan untuk dropdown.
   */
  async getOptions() {
    const response = await apiClient.get('/api/v1/rooms/options')
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Gagal memuat opsi ruangan.',
      status: response.status,
    }
  },
}

export default roomService
