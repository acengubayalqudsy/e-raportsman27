import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  masterOptions,
  masterSchemas,
  teacherSummary as defaultTeacherSummary,
} from '../../data/masterData.js'
import teacherService from '../../services/teacherService.js'
import {
  MasterDeleteModal,
  MasterDetailModal,
  MasterEntityModal,
  MasterImportModal,
} from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import MasterSummary from './MasterSummary.jsx'

const summarySparklines = [
  'M0 27 C7 23 11 14 17 18 C24 22 29 7 36 10 C43 13 47 5 52 8',
  'M0 28 C6 21 11 23 17 15 C23 8 29 17 36 11 C43 5 47 12 52 7',
  'M0 25 C7 27 10 13 18 14 C25 15 29 22 36 16 C43 10 47 17 52 12',
  'M0 27 C8 19 12 23 18 17 C25 10 31 20 38 12 C44 5 48 11 52 8',
  'M0 28 C7 18 12 22 19 15 C26 8 31 19 38 13 C44 7 48 5 52 9',
]

// NIP is optional for honorer teachers in accordance with Phase 4 rules
const teacherFormFields = masterSchemas.guru.formFields.map((field) => ({
  ...field,
  required: field.key === 'nip' ? false : field.required,
  section: ['name', 'nip', 'nuptk', 'gender', 'birthPlace', 'birthDate'].includes(field.key)
    ? 'Identitas Guru'
    : ['phone', 'email', 'address'].includes(field.key)
      ? 'Kontak & Domisili'
      : 'Data Kepegawaian',
  fullWidth: field.key === 'address',
}))

const teacherFilterFields = [
  { key: 'status', label: 'Status', options: masterOptions.teacherStatusFilters },
  { key: 'gender', label: 'Jenis Kelamin', options: masterOptions.genderFilters },
  { key: 'employmentStatus', label: 'Status Kepegawaian', options: masterOptions.employmentStatusFilters },
  { key: 'subject', label: 'Mata Pelajaran', options: masterOptions.subjectFilters },
]

const initialFilters = {
  status: 'Semua Status',
  gender: 'Semua',
  employmentStatus: 'Semua Kepegawaian',
  subject: 'Semua Mata Pelajaran',
}

function formatPercentage(value, total) {
  if (!total || total === 0) return '0%'

  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value / total) * 100)}%`
}

function createDetailSections(teacher) {
  return [
    {
      title: 'Identitas Guru',
      items: [
        { label: 'NIP', value: teacher.nip || '-' },
        { label: 'NUPTK', value: teacher.nuptk || '-' },
        { label: 'Tempat, Tanggal Lahir', value: teacher.birth || '-' },
        { label: 'Jenis Kelamin', value: teacher.gender || '-' },
        { label: 'Status', value: teacher.status || 'Aktif' },
      ],
    },
    {
      title: 'Kontak & Domisili',
      items: [
        { label: 'Nomor Telepon', value: teacher.phone || '-' },
        { label: 'Email', value: teacher.email || '-' },
        { label: 'Alamat', value: teacher.address || '-' },
      ],
    },
    {
      title: 'Data Kepegawaian',
      items: [
        { label: 'Status Kepegawaian', value: teacher.employmentStatus || '-' },
        { label: 'Mata Pelajaran Utama', value: teacher.subject || '-' },
        { label: 'Jenis Ketenagaan', value: teacher.type || 'Guru' },
      ],
    },
  ]
}

function MasterTeacherView({ onNotify }) {
  const [teachers, setTeachers] = useState([])
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 8, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [selectedRows, setSelectedRows] = useState(() => new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modal, setModal] = useState(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 1. Fetch statistics from REST API
  useEffect(() => {
    let isMounted = true

    teacherService
      .getTeacherStats()
      .then((result) => {
        if (!isMounted) return
        if (result.success && result.data) {
          setStats(result.data)
        }
      })
      .catch(() => {
        // Silently catch stats failure
      })

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // 2. Fetch paginated teachers list with search and filters from MariaDB
  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true)

      teacherService
      .getTeachers({
        page: currentPage,
        per_page: rowsPerPage,
        search: searchQuery,
        status: filters.status,
        gender: filters.gender,
        employmentStatus: filters.employmentStatus,
        subject: filters.subject,
      })
      .then((result) => {
        if (!isMounted) return
        if (result.success) {
          setTeachers(result.data)
          setMeta(result.meta)
          setFetchError(null)
        } else {
          setFetchError(result.error || 'Gagal memuat data guru dari server.')
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setFetchError('Terjadi kegagalan jaringan saat menghubungi server backend.')
        setIsLoading(false)
      })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [currentPage, rowsPerPage, searchQuery, filters, refreshTrigger])

  // Calculate live summary items from database stats
  const summaryItems = useMemo(() => {
    if (!stats) {
      return defaultTeacherSummary.map((item, index) => ({
        ...item,
        value: '...',
        sparkline: summarySparklines[index % summarySparklines.length],
      }))
    }

    const total = stats.total || 0
    const counts = {
      'Total Guru': total,
      'Guru Aktif': stats.active || 0,
      'Laki-laki': stats.male || 0,
      Perempuan: stats.female || 0,
      'Guru ASN': stats.asn || 0,
    }

    return defaultTeacherSummary.map((item, index) => {
      const value = counts[item.title] ?? 0
      const caption = item.title === 'Total Guru' ? item.caption : formatPercentage(value, total)
      return {
        ...item,
        caption,
        sparkline: summarySparklines[index % summarySparklines.length],
        value: value.toLocaleString('id-ID'),
      }
    })
  }, [stats])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  const toggleTeacher = (id) => {
    setSelectedRows((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = teachers.length > 0 && teachers.every((teacher) => selectedRows.has(teacher.id))

  const toggleVisibleTeachers = () => {
    setSelectedRows((current) => {
      const next = new Set(current)
      teachers.forEach((teacher) => {
        if (allVisibleSelected) next.delete(teacher.id)
        else next.add(teacher.id)
      })
      return next
    })
  }

  const openDetail = (teacher) => {
    setOpenMenuId(null)
    setModal({ type: 'detail', teacher })
  }

  const openEdit = (teacher) => {
    setOpenMenuId(null)
    setModal({ type: 'edit', teacher })
  }

  const openDelete = (teacher) => {
    setOpenMenuId(null)
    setModal({ type: 'delete', teacher })
  }

  // Create or Update teacher
  const saveTeacher = async (formData) => {
    const source = modal?.teacher
    if (source) {
      const result = await teacherService.updateTeacher(source.id, formData)
      if (!result.success) {
        return result
      }
      setModal(null)
      onNotify(`Data guru ${result.data?.name || formData.name} berhasil diperbarui di database.`)
      setRefreshTrigger((k) => k + 1)
      return result
    }

    const result = await teacherService.createTeacher(formData)
    if (!result.success) {
      return result
    }
    setModal(null)
    onNotify(`Guru baru ${result.data?.name || formData.name} berhasil ditambahkan ke database.`)
    setCurrentPage(1)
    setRefreshTrigger((k) => k + 1)
    return result
  }

  // Confirm soft delete teacher
  const confirmDelete = async (teacher) => {
    const result = await teacherService.deleteTeacher(teacher.id)
    if (result.success) {
      setModal(null)
      onNotify(`Data guru ${teacher.name} berhasil dihapus dari sistem.`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(`Gagal menghapus data guru: ${result.error}`)
    }
  }

  // Toggle active/inactive status
  const toggleTeacherStatus = async (teacher) => {
    const nextStatus = teacher.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif'
    setOpenMenuId(null)

    const result = await teacherService.updateTeacher(teacher.id, {
      ...teacher,
      status: nextStatus,
    })

    if (result.success) {
      onNotify(`Status ${teacher.name} diubah menjadi ${nextStatus}.`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(`Gagal mengubah status: ${result.error}`)
    }
  }

  return (
    <>
      <MasterSummary items={summaryItems} />

      <section className="master-data-workspace">
        <div className="master-data-toolbar">
          <div className="master-filter-grid teacher-filters">
            {teacherFilterFields.map((field) => (
              <label className="master-field" key={field.key}>
                <span>{field.label}</span>
                <select
                  value={filters[field.key]}
                  onChange={(event) => updateFilter(field.key, event.target.value)}
                >
                  {field.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>

          <label className="master-search">
            <SearchInput
              aria-label="Cari nama, NIP, atau NUPTK guru"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari nama / NIP guru..."
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="master-data-actions">
          <div>
            {selectedRows.size > 0 && (
              <span className="master-selection-count">{selectedRows.size} data dipilih</span>
            )}
          </div>
          <div>
            <Button className="master-button secondary" onClick={() => setModal({ type: 'import' })}>
              <Icon name="download" />
              Import Guru
            </Button>
            <Button
              className="master-button secondary"
              onClick={() => onNotify('Data guru siap diekspor. Fitur Excel akan diintegrasikan pada tahap berikutnya.')}
            >
              <Icon name="document" />
              Export Excel
            </Button>
            <Button className="master-button primary" onClick={() => setModal({ type: 'add' })}>
              <Icon name="plus" />
              Tambah Guru
            </Button>
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="master-bulk-toolbar">
            <strong>{selectedRows.size} guru dipilih</strong>
            <span>
              <button
                onClick={() => onNotify(`${selectedRows.size} data guru siap diekspor.`)}
                type="button"
              >
                Export
              </button>
              <button onClick={() => setSelectedRows(new Set())} type="button">Batal Pilih</button>
            </span>
          </div>
        )}

        {fetchError && (
          <div className="master-fetch-error-banner" role="alert">
            <Icon name="info" />
            <div className="master-fetch-error-content">
              <strong>Gagal Memuat Data</strong>
              <p>{fetchError}</p>
            </div>
            <Button
              className="master-button secondary"
              onClick={() => setRefreshTrigger((k) => k + 1)}
              type="button"
            >
              <Icon name="refresh" />
              Coba Lagi
            </Button>
          </div>
        )}

        <div className="master-table-heading">
          <h3>Daftar Guru ({meta.total} Total)</h3>
        </div>

        <div className="master-table-scroll">
          <table className="master-teacher-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Pilih semua guru pada halaman ini"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleTeachers}
                    type="checkbox"
                  />
                </th>
                <th>No</th>
                <th>Nama Guru</th>
                <th>NIP / NUPTK</th>
                <th>JK</th>
                <th>Mata Pelajaran</th>
                <th>Kepegawaian</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="master-empty-row" colSpan="9">
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#64748b' }}>Memuat data guru dari database...</p>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan="9">
                    <Icon name="search" />
                    <strong>Data tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, index) => {
                  const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1
                  const nipDisplay = teacher.nip && teacher.nip !== '-' ? teacher.nip : '-'
                  const nuptkDisplay = teacher.nuptk && teacher.nuptk !== '-' ? teacher.nuptk : '-'
                  const genderCode = teacher.gender_code || (teacher.gender === 'Perempuan' ? 'P' : 'L')
                  const employmentClass = (teacher.employment_status || 'asn').toLowerCase()
                  const statusClass = (teacher.status || 'aktif').toLowerCase().replaceAll(' ', '-')

                  return (
                    <tr key={teacher.id}>
                      <td>
                        <input
                          aria-label={`Pilih ${teacher.name}`}
                          checked={selectedRows.has(teacher.id)}
                          onChange={() => toggleTeacher(teacher.id)}
                          type="checkbox"
                        />
                      </td>
                      <td>{rowNumber}</td>
                      <td className="master-name-cell">
                        <strong>{teacher.name}</strong>
                      </td>
                      <td className="master-nip-cell">
                        <strong>{nipDisplay}</strong>
                        <small>{nuptkDisplay}</small>
                      </td>
                      <td>
                        <span className={`master-gender ${genderCode === 'P' ? 'female' : 'male'}`}>
                          {genderCode}
                        </span>
                      </td>
                      <td>{teacher.subject || '-'}</td>
                      <td>
                        <span className={`master-employment-status ${employmentClass}`}>
                          {teacher.employment_status || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`master-data-status ${statusClass}`}>
                          {teacher.status || 'Aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="master-row-actions">
                          <button aria-label={`Lihat ${teacher.name}`} onClick={() => openDetail(teacher)} type="button">
                            <Icon name="eye" />
                          </button>
                          <button aria-label={`Edit ${teacher.name}`} onClick={() => openEdit(teacher)} type="button">
                            <Icon name="edit" />
                          </button>
                          <span>
                            <button
                              aria-label={`Aksi lainnya ${teacher.name}`}
                              onClick={() => setOpenMenuId((current) => current === teacher.id ? null : teacher.id)}
                              type="button"
                            >
                              <Icon name="more" />
                            </button>
                            {openMenuId === teacher.id && (
                              <span className="master-action-menu">
                                <button onClick={() => openDetail(teacher)} type="button">Lihat Detail</button>
                                <button onClick={() => openEdit(teacher)} type="button">Edit Data</button>
                                <button onClick={() => toggleTeacherStatus(teacher)} type="button">
                                  {teacher.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                  onClick={() => openDelete(teacher)}
                                  style={{ color: '#dc2626' }}
                                  type="button"
                                >
                                  Hapus Data
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <MasterPagination
          currentPage={meta.current_page}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
          }}
          rowsPerPage={meta.per_page}
          totalItems={meta.total}
          totalPages={meta.last_page}
        />
      </section>

      {modal?.type === 'import' && (
        <MasterImportModal
          entityLabel="Guru"
          onClose={() => setModal(null)}
          onComplete={() => {
            setModal(null)
            onNotify('Simulasi import data guru berhasil.')
          }}
        />
      )}

      {['add', 'edit'].includes(modal?.type) && (
        <MasterEntityModal
          entityLabel="Guru"
          fields={teacherFormFields}
          initialData={modal.teacher}
          mode={modal.type}
          onClose={() => setModal(null)}
          onSave={saveTeacher}
        />
      )}

      {modal?.type === 'detail' && (
        <MasterDetailModal
          entityLabel="Guru"
          name={modal.teacher.name}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', teacher: modal.teacher })}
          sections={createDetailSections(modal.teacher)}
        />
      )}

      {modal?.type === 'delete' && (
        <MasterDeleteModal
          entityLabel="Guru"
          item={modal.teacher}
          onClose={() => setModal(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}

export default MasterTeacherView
