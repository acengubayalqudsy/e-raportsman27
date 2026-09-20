import apiClient from './apiClient.js'

/**
 * Service Layer untuk Master Data Siswa.
 * Mengintegrasikan komponen frontend dengan REST API Laravel 12 & MariaDB
 * melalui apiClient terpusat dengan autentikasi berbasis Sanctum session cookie.
 */

export const studentService = {
  /**
   * Mengambil daftar siswa dari server dengan paginasi, pencarian, dan filter.
   * @param {Object} params - { page, per_page, search, className, grade, studyGroup, status, gender, sort_by, sort_dir }
   */
  async getStudents(params = {}) {
    const query = new URLSearchParams()

    if (params.page) query.set('page', params.page)
    if (params.per_page || params.rowsPerPage) query.set('per_page', params.per_page || params.rowsPerPage)
    if (params.search && params.search.trim()) query.set('search', params.search.trim())

    if (params.className && params.className !== 'Semua Kelas') {
      query.set('class_name', params.className)
    }
    if (params.grade && params.grade !== 'Semua Tingkat') {
      query.set('grade', params.grade)
    }
    if (params.studyGroup && params.studyGroup !== 'Semua Rombel') {
      query.set('study_group', params.studyGroup)
    }
    if (params.status && params.status !== 'Semua Status') {
      query.set('status', params.status === 'Siswa Aktif' ? 'Aktif' : params.status)
    }
    if (params.gender && params.gender !== 'Semua') {
      query.set('gender', params.gender)
    }
    if (params.sort_by) query.set('sort_by', params.sort_by)
    if (params.sort_dir) query.set('sort_dir', params.sort_dir)

    const queryString = query.toString()
    const endpoint = `/api/v1/master/students${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get(endpoint)

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
      error: response.message || 'Gagal memuat data siswa.',
      status: response.status,
    }
  },

  /**
   * Mengambil detail satu siswa berdasarkan ID dari database.
   */
  async getStudentById(id) {
    const response = await apiClient.get(`/api/v1/master/students/${id}`)
    if (response.success) {
      return { success: true, data: response.data }
    }
    return {
      success: false,
      error: response.message || 'Data siswa tidak ditemukan.',
      status: response.status,
    }
  },

  /**
   * Menambahkan data siswa baru ke database melalui REST API.
   */
  async createStudent(formData) {
    const response = await apiClient.post('/api/v1/master/students', formData)

    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }

    // Format error message dari response 422
    let errorMsg = response.message || 'Gagal menambahkan data siswa.'
    if (response.errors && typeof response.errors === 'object') {
      const fieldErrors = Object.values(response.errors).flat()
      if (fieldErrors.length > 0) {
        errorMsg = fieldErrors[0]
      }
    }

    return {
      success: false,
      error: errorMsg,
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Memperbarui data siswa pada database melalui REST API.
   */
  async updateStudent(id, formData) {
    const response = await apiClient.put(`/api/v1/master/students/${id}`, formData)

    if (response.success) {
      return { success: true, data: response.data, message: response.message }
    }

    // Format error message dari response 422
    let errorMsg = response.message || 'Gagal memperbarui data siswa.'
    if (response.errors && typeof response.errors === 'object') {
      const fieldErrors = Object.values(response.errors).flat()
      if (fieldErrors.length > 0) {
        errorMsg = fieldErrors[0]
      }
    }

    return {
      success: false,
      error: errorMsg,
      errors: response.errors || null,
      status: response.status,
    }
  },

  /**
   * Menghapus siswa menggunakan soft delete pada database.
   */
  async deleteStudent(id) {
    const response = await apiClient.delete(`/api/v1/master/students/${id}`)

    if (response.success) {
      return { success: true, message: response.message }
    }

    return {
      success: false,
      error: response.message || 'Gagal menghapus data siswa.',
      status: response.status,
    }
  },

  /**
   * Mengambil statistik agregat data siswa secara dinamis dari database.
   */
  async getSummaryStats() {
    const response = await apiClient.get('/api/v1/master/students/stats')

    if (!response.success || !response.data) {
      return null
    }

    const stats = response.data
    const total = stats.total || 0
    const male = stats.male || 0
    const female = stats.female || 0
    const active = stats.active || 0
    const alumni = stats.alumni || 0
    const activeClasses = stats.active_classes || 0

    const malePercentage = total > 0 ? ((male / total) * 100).toFixed(1).replace('.', ',') : '0'
    const femalePercentage = total > 0 ? ((female / total) * 100).toFixed(1).replace('.', ',') : '0'

    return [
      {
        title: 'Total Siswa',
        value: total.toLocaleString('id-ID'),
        caption: `${active.toLocaleString('id-ID')} Siswa Aktif`,
        icon: 'users',
        tone: 'green',
        trend: 'up',
      },
      {
        title: 'Laki-laki',
        value: male.toLocaleString('id-ID'),
        caption: `${malePercentage}% dari total`,
        icon: 'user',
        tone: 'blue',
      },
      {
        title: 'Perempuan',
        value: female.toLocaleString('id-ID'),
        caption: `${femalePercentage}% dari total`,
        icon: 'user',
        tone: 'purple',
      },
      {
        title: 'Kelas Aktif',
        value: String(activeClasses),
        caption: 'Rombongan Belajar',
        icon: 'academic',
        tone: 'orange',
      },
      {
        title: 'Alumni',
        value: alumni.toLocaleString('id-ID'),
        caption: 'Siswa Lulus',
        icon: 'cap',
        tone: 'teal',
      },
    ]
  },
}

export default studentService
