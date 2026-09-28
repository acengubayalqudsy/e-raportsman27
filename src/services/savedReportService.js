import apiClient from './apiClient.js'

const base = '/api/v1/reports'
const query = (params) => {
  const values = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) values.set(key, value)
  })
  return values.toString()
}
const normalize = (response) => response.success
  ? { success: true, data: response.data, meta: response.raw?.meta, message: response.message }
  : { success: false, error: response.message || 'Permintaan laporan gagal.', errors: response.errors || {}, status: response.status }

export const savedReportService = {
  options: async (params) => normalize(await apiClient.get(`${base}/options?${query(params)}`)),
  list: async (params) => normalize(await apiClient.get(`${base}?${query(params)}`)),
  get: async (id) => normalize(await apiClient.get(`${base}/${id}`)),
  create: async (data) => normalize(await apiClient.post(base, data)),
  update: async (id, data) => normalize(await apiClient.put(`${base}/${id}`, data)),
  refresh: async (id) => normalize(await apiClient.post(`${base}/${id}/refresh`, {})),
  remove: async (id) => normalize(await apiClient.delete(`${base}/${id}`)),
}

export default savedReportService
