import apiClient from './apiClient.js'

function resultFrom(response, fallback) {
  if (response.success) {
    return { success: true, data: response.data, meta: response.raw?.meta || null, status: response.status }
  }
  return {
    success: false,
    error: response.message || fallback,
    errors: response.errors || null,
    status: response.status,
    data: [],
    meta: null,
  }
}

const journalService = {
  async list(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value)
    })
    return resultFrom(
      await apiClient.get(`/api/v1/journals?${query.toString()}`),
      'Gagal memuat jurnal mengajar.',
    )
  },

  async create(payload) {
    return resultFrom(
      await apiClient.post('/api/v1/journals', payload),
      'Gagal menyimpan jurnal mengajar.',
    )
  },

  async update(id, payload) {
    return resultFrom(
      await apiClient.put(`/api/v1/journals/${id}`, payload),
      'Gagal memperbarui jurnal mengajar.',
    )
  },

  async remove(id) {
    return resultFrom(
      await apiClient.delete(`/api/v1/journals/${id}`),
      'Gagal menghapus jurnal mengajar.',
    )
  },
}

export default journalService
