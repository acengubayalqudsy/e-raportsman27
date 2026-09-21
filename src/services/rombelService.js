import apiClient from './apiClient.js'

/**
 * Service Layer untuk Keanggotaan Rombel Fase 5B:
 * - Mengambil daftar anggota rombel per kelas/semester dengan pagination & filter
 * - Mengambil siswa yang belum terdaftar di rombel pada semester aktif
 * - Menambahkan siswa ke dalam rombel (bulk enroll)
 * - Memindahkan siswa antar-rombel (transfer)
 * - Mengeluarkan siswa dari rombel (soft delete)
 * - Sinkronisasi preview & commit dengan tabel students.current_class_name
 */

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

export const rombelService = {
  /**
   * Mengambil anggota rombel per kelas dan semester
   */
  async getMembers(params = {}) {
    const query = new URLSearchParams()
    if (params.class_id) query.set('class_id', params.class_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.status && params.status !== 'Semua Status') query.set('status', params.status)
    if (params.page) query.set('page', params.page)
    if (params.per_page) query.set('per_page', params.per_page)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/rombel/members${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.raw?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params.per_page || 15,
          total: Array.isArray(response.data) ? response.data.length : 0,
        },
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat daftar anggota rombel.'),
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    }
  },

  /**
   * Mengambil daftar siswa yang tersedia (belum terdaftar di semester tersebut)
   */
  async getAvailableStudents(params = {}) {
    const query = new URLSearchParams()
    if (params.semester_id) query.set('semester_id', params.semester_id)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())
    if (params.limit) query.set('limit', params.limit)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/rombel/available-students${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat siswa yang tersedia.'),
      data: [],
    }
  },

  /**
   * Daftarkan siswa ke rombel (single atau multiple siswa)
   */
  async enrollMembers(payload) {
    const response = await apiClient.post('/api/v1/academic/rombel/members', payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Siswa berhasil didaftarkan ke rombel.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal mendaftarkan siswa ke rombel.'),
      errors: response.errors,
    }
  },

  /**
   * Mutasi / Pindah rombel siswa
   */
  async transferMember(memberId, payload) {
    const response = await apiClient.post(`/api/v1/academic/rombel/transfer/${memberId}`, payload)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Siswa berhasil dipindahkan ke rombel baru.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memindahkan siswa ke rombel tujuan.'),
      errors: response.errors,
    }
  },

  /**
   * Keluarkan siswa dari rombel (soft delete)
   */
  async removeMember(memberId) {
    const response = await apiClient.delete(`/api/v1/academic/rombel/members/${memberId}`)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Siswa berhasil dikeluarkan dari rombel.',
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal mengeluarkan siswa dari rombel.'),
    }
  },

  /**
   * Statistik keanggotaan rombel
   */
  async getStats(params = {}) {
    const query = new URLSearchParams()
    if (params.academic_year_id) query.set('academic_year_id', params.academic_year_id)
    if (params.semester_id) query.set('semester_id', params.semester_id)

    const qs = query.toString()
    const response = await apiClient.get(`/api/v1/academic/rombel/stats${qs ? `?${qs}` : ''}`)

    if (response.success) {
      return {
        success: true,
        data: response.data || {},
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat statistik rombel.'),
      data: {},
    }
  },

  /**
   * Preview sinkronisasi rombel dengan master siswa
   */
  async getSyncPreview(semesterId) {
    const response = await apiClient.get(`/api/v1/academic/rombel/sync-preview?semester_id=${semesterId}`)

    if (response.success) {
      return {
        success: true,
        data: response.data || {},
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal memuat preview sinkronisasi.'),
    }
  },

  /**
   * Eksekusi sinkronisasi rombel ke current_class_name master siswa
   */
  async commitSync(semesterId) {
    const response = await apiClient.post('/api/v1/academic/rombel/sync-commit', {
      semester_id: semesterId,
    })

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Sinkronisasi rombel berhasil.',
        data: response.data,
      }
    }

    return {
      success: false,
      message: formatErrorMessage(response, 'Gagal mengeksekusi sinkronisasi rombel.'),
    }
  },
}

export default rombelService
