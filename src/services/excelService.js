import { API_BASE_URL, getCsrfCookie } from './apiClient.js'

const base = `${API_BASE_URL}/api/v1/excel`

function cookie(name) {
  const item = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return item ? decodeURIComponent(item.slice(name.length + 1)) : ''
}

async function call(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (method !== 'GET') {
    await getCsrfCookie()
    headers['X-XSRF-TOKEN'] = cookie('XSRF-TOKEN')
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(body)
    }
  }
  const response = await fetch(`${base}${path}`, { method, headers, body, credentials: 'include' })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Object.values(result.errors || {}).flat().join(' ')
    throw new Error(detail || result.message || `Permintaan Excel gagal (${response.status}).`)
  }
  return result.data
}

async function download(module, action, context = {}) {
  const url = new URL(`${base}/${module}/${action}`)
  Object.entries(context).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value) })
  const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.message || `Download gagal (${response.status}).`)
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
    const response = await fetch(`${base.replace('/excel', '/reports')}/${id}/excel`, { credentials: 'include' })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(result.message || `Download laporan gagal (${response.status}).`)
    }
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-${id}.xlsx`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  previewLocal(module, file, context = {}) {
    const body = new FormData()
    body.append('source', 'local')
    body.append('file', file)
    Object.entries(context).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') body.append(key, value) })
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
