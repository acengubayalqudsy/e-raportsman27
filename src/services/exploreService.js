import apiClient from './apiClient.js'

export const exploreService = {
  /**
   * Fetch educational news from Laravel backend aggregator
   * @param {Object} params - { category, q }
   */
  async getNews(params = {}) {
    try {
      const query = new URLSearchParams()
      if (params.category && params.category !== 'all' && params.category !== 'semua') {
        query.set('category', params.category)
      }
      if (params.q && params.q.trim()) {
        query.set('q', params.q.trim())
      }

      const queryString = query.toString() ? `?${query.toString()}` : ''
      const res = await apiClient.get(`/api/v1/explore/news${queryString}`)

      if (res && res.success && Array.isArray(res.data)) {
        return {
          success: true,
          data: res.data,
          total: res.total ?? res.data.length,
        }
      }

      return {
        success: false,
        data: [],
        error: res?.error || 'Gagal memuat berita pendidikan.',
      }
    } catch (err) {
      return {
        success: false,
        data: [],
        error: err.message || 'Terjadi kesalahan saat memuat berita.',
      }
    }
  },
}

export default exploreService
