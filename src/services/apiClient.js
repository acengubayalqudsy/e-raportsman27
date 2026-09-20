/**
 * Centralized API Client for E-Raport SMAN 27 Garut
 * Handles Laravel Sanctum cookie-based session authentication,
 * CSRF pre-flight, credentials inclusion, and standardized error responses.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

/**
 * Extract CSRF token from document.cookie (XSRF-TOKEN cookie set by Laravel Sanctum)
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const raw = parts.pop().split(';').shift()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

/**
 * Fetch CSRF cookie from Laravel Sanctum
 */
export async function getCsrfCookie() {
  try {
    const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  // Attach Content-Type for JSON body
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  // Attach CSRF token on mutating requests if available
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xsrfToken = getCookie('XSRF-TOKEN')
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'include',
    })

    const isJson = (response.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await response.json().catch(() => null) : null

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        data: data?.data !== undefined ? data.data : data,
        message: data?.message || null,
        raw: data,
      }
    }

    // Handle standard HTTP error statuses
    const errorMessage = data?.message || getDefaultErrorMessage(response.status)

    return {
      success: false,
      status: response.status,
      message: errorMessage,
      errors: data?.errors || null,
      raw: data,
    }
  } catch (error) {
    // Network errors or backend unreachable
    return {
      success: false,
      status: 0,
      message: 'Tidak dapat terhubung ke server. Pastikan backend aktif dan jaringan stabil.',
      error: error?.message || 'Network error',
    }
  }
}

function getDefaultErrorMessage(status) {
  switch (status) {
    case 401:
      return 'Sesi Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.'
    case 403:
      return 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.'
    case 419:
      return 'Sesi keamanan kedaluwarsa. Silakan muat ulang halaman dan coba lagi.'
    case 422:
      return 'Data yang dikirimkan tidak valid.'
    case 429:
      return 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.'
    case 500:
    case 502:
    case 503:
      return 'Terjadi kendala pada server backend. Silakan coba beberapa saat lagi.'
    default:
      return 'Terjadi kesalahan pada sistem. Silakan coba lagi.'
  }
}

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Request Sanctum CSRF cookie
   */
  initCsrf: () => getCsrfCookie(),

  /**
   * Perform user login
   */
  login: async (identifier, password) => {
    // Ensure fresh CSRF cookie before login attempt
    await getCsrfCookie()

    return request('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier, password },
    })
  },

  /**
   * Get authenticated user profile & roles
   */
  me: () => request('/api/v1/auth/me', { method: 'GET' }),

  /**
   * Perform user logout
   */
  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
}

export default {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => request(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
  auth: authApi,
  getCsrfCookie,
}
