import apiClient from './apiClient.js'

function unwrap(response) {
  if (!response.success) {
    throw new Error(Object.values(response.errors ?? {}).flat()[0] || response.message || 'Gagal menghubungi server.')
  }
  return response.data
}

export const settingsService = {
  get: async (group) => unwrap(await apiClient.get(`/api/v1/settings/${group}`)),
  save: async (group, value) => unwrap(await apiClient.put(`/api/v1/settings/${group}`, value)),
  logs: async () => unwrap(await apiClient.get('/api/v1/settings/activity-logs')),
  backups: async () => unwrap(await apiClient.get('/api/v1/settings/backups')),
  createBackup: async () => unwrap(await apiClient.post('/api/v1/settings/backups', {})),
  restoreBackup: async (id) => unwrap(await apiClient.post(`/api/v1/settings/backups/${id}/restore`, { confirmation: 'RESTORE' })),
}
