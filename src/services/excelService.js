import apiClient, { API_BASE_URL } from './apiClient.js'

const base = `${API_BASE_URL}/api/v1/excel`

async function call(path, { method = 'GET', body } = {}) {
  const endpoint = `/api/v1/excel${path}`
  const response = method === 'POST'
    ? await apiClient.post(endpoint, body)
    : await apiClient.get(endpoint)

  if (!response.success) {
    const detail = response.errors ? Object.values(response.errors).flat().join(' ') : ''
    throw new Error(detail || response.message || `Permintaan Excel gagal (${response.status}).`)
  }
  return response.data
}

async function download(module, action, context = {}) {
  const url = new URL(`${base}/${module}/${action}`)
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    },
  })
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      throw new Error('Sesi Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.')
    }
    const result = await response.json().catch(() => ({}))
    const detail = result.errors ? Object.values(result.errors).flat().join(' ') : ''
    throw new Error(detail || result.message || `Download gagal (${response.status}).`)
  }
  const blobUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] || `${module}.xlsx`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

const excelService = {
  download,
  async downloadSavedReport(id) {
    const response = await fetch(`${API_BASE_URL}/api/v1/reports/${id}/excel`, {
      credentials: 'include',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
      },
    })
    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        throw new Error('Sesi Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.')
      }
      const result = await response.json().catch(() => ({}))
      const detail = result.errors ? Object.values(result.errors).flat().join(' ') : ''
      throw new Error(detail || result.message || `Download laporan gagal (${response.status}).`)
    }
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] || `laporan-${id}.xlsx`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  previewLocal(module, file, context = {}) {
    const body = new FormData()
    body.append('source', 'local')
    body.append('file', file)
    Object.entries(context).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') body.append(key, value)
    })
    return call(`/${module}/preview`, { method: 'POST', body })
  },
  previewOneDrive(module, fileId, sheet, fileName, context = {}) {
    const cleanContext = Object.fromEntries(Object.entries(context).filter(([, value]) => value !== '' && value !== null && value !== undefined))
    return call(`/${module}/preview`, { method: 'POST', body: { source: 'onedrive', file_id: fileId, sheet, file_name: fileName, ...cleanContext } })
  },
  commit(module, previewId) { return call(`/${module}/commit`, { method: 'POST', body: { preview_id: previewId, confirm_updates: true } }) },
  microsoftStatus() { return call('/microsoft/status') },
  microsoftFiles(folderId = '') { return call(`/microsoft/files${folderId ? `?folder_id=${encodeURIComponent(folderId)}` : ''}`) },
  microsoftSheets(fileId) { return call(`/microsoft/files/${encodeURIComponent(fileId)}/worksheets`) },
  connectMicrosoft() { window.open(`${base.replace(/\/api\/v1\/excel$/, '')}/excel/microsoft/connect`, 'e-raport-microsoft', 'popup,width=650,height=760') },
}

export default excelService
