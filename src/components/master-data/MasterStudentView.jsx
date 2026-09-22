import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  masterOptions,
  masterSchemas,
} from '../../data/masterData.js'
import { studentService } from '../../services/studentService.js'
import { religionService } from '../../services/religionService.js'
import { MasterDeleteModal, MasterDetailModal, MasterEntityModal, MasterImportModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import MasterSummary from './MasterSummary.jsx'

const summarySparklines = [
  'M0 28 C8 25 10 15 18 19 C26 23 29 5 38 7 C45 8 46 20 52 13',
  'M0 27 C6 23 9 10 16 14 C25 22 28 8 35 9 C42 10 45 16 52 12',
  'M0 25 C8 26 10 11 18 12 C26 13 28 21 36 16 C43 11 47 17 52 14',
  'M0 27 C8 15 14 22 20 16 C28 7 33 20 40 13 C45 8 48 4 52 8',
  'M0 27 C7 19 12 24 18 20 C26 13 31 19 38 10 C44 3 47 10 52 7',
]

const studentFormFields = [
  ...masterSchemas.siswa.formFields.map((field) => ({
    ...field,
    section: ['name', 'nis', 'nisn', 'birthPlace', 'birthDate', 'gender', 'religion', 'status'].includes(field.key)
      ? 'Identitas Siswa'
      : ['address', 'phone'].includes(field.key)
        ? 'Data Domisili'
        : ['previousSchool', 'acceptedClass', 'admissionDate'].includes(field.key)
          ? 'Data Akademik Awal'
          : ['fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'parentPhone'].includes(field.key)
            ? 'Data Orang Tua'
            : 'Data Wali',
    fullWidth: ['address', 'guardianAddress'].includes(field.key),
  })),
  { key: 'className', label: 'Kelas Saat Ini', type: 'select', options: masterOptions.classes, section: 'Data Akademik Awal' },
]

const studentFilterFields = [
  { key: 'className', label: 'Kelas', options: masterOptions.classFilters },
  { key: 'grade', label: 'Tingkat', options: masterOptions.gradeFilters },
  { key: 'studyGroup', label: 'Rombongan Belajar', options: masterOptions.studyGroupFilters },
  { key: 'status', label: 'Status', options: ['Siswa Aktif', ...masterOptions.studentStatusFilters] },
  { key: 'gender', label: 'Jenis Kelamin', options: masterOptions.genderFilters },
]

const initialFilters = {
  className: 'Semua Kelas',
  grade: 'Semua Tingkat',
  studyGroup: 'Semua Rombel',
  status: 'Siswa Aktif',
  gender: 'Semua',
}

function createDetailSections(student) {
  return [
    {
      title: 'Identitas',
      items: [
        { label: 'NIS', value: student.nis },
        { label: 'NISN', value: student.nisn },
        { label: 'Tempat, Tanggal Lahir', value: student.birth },
        { label: 'Jenis Kelamin', value: student.gender },
        { label: 'Agama', value: student.religion },
        { label: 'Status', value: student.status },
      ],
    },
    {
      title: 'Data Akademik & Domisili',
      items: [
        { label: 'Kelas', value: student.className },
        { label: 'Sekolah Asal', value: student.previousSchool },
        { label: 'Tanggal Diterima', value: student.admissionDate },
        { label: 'Alamat', value: student.address },
        { label: 'Nomor Telepon', value: student.phone },
      ],
    },
    {
      title: 'Orang Tua',
      items: [
        { label: 'Nama Ayah', value: student.fatherName },
        { label: 'Nama Ibu', value: student.motherName },
        { label: 'Pekerjaan Ayah', value: student.fatherOccupation },
        { label: 'Pekerjaan Ibu', value: student.motherOccupation },
        { label: 'Telepon Orang Tua', value: student.parentPhone },
      ],
    },
    {
      title: 'Data Wali',
      items: [
        { label: 'Nama Wali', value: student.guardianName },
        { label: 'Alamat Wali', value: student.guardianAddress },
        { label: 'Telepon Wali', value: student.guardianPhone },
      ],
    },
  ]
}

function MasterStudentView({ onNotify }) {
  const [students, setStudents] = useState([])
  const [summaryCards, setSummaryCards] = useState([])
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
  const [availableReligions, setAvailableReligions] = useState([])

  // Load active religions for student form dropdown
  useEffect(() => {
    let isMounted = true
    religionService
      .getReligions({ all: 1, status: 'Aktif' })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          const names = res.data.map((r) => r.name)
          if (names.length > 0) {
            setAvailableReligions(names)
          }
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  const activeStudentFormFields = useMemo(() => {
    return studentFormFields.map((field) => {
      if (field.key === 'religion' && availableReligions.length > 0) {
        return { ...field, options: availableReligions }
      }
      return field
    })
  }, [availableReligions])

  // Load summary stats whenever refreshTrigger changes
  useEffect(() => {
    let isMounted = true

    studentService
      .getSummaryStats()
      .then((stats) => {
        if (!isMounted) return
        if (stats) {
          setSummaryCards(stats)
        }
      })
      .catch(() => {
        // Silently ignore stats failure
      })

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // Load students whenever pagination, search, filters, or refreshTrigger change
  useEffect(() => {
    let isMounted = true

    studentService
      .getStudents({
        page: currentPage,
        per_page: rowsPerPage,
        search: searchQuery,
        className: filters.className,
        grade: filters.grade,
        studyGroup: filters.studyGroup,
        status: filters.status,
        gender: filters.gender,
      })
      .then((result) => {
        if (!isMounted) return
        if (result.success) {
          setStudents(result.data)
          setMeta(result.meta)
          setFetchError(null)
        } else {
          setFetchError(result.error || 'Gagal memuat data siswa dari server.')
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setFetchError('Terjadi kegagalan jaringan saat menghubungi server.')
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentPage, rowsPerPage, searchQuery, filters, refreshTrigger])

  // Format sparklines for summary cards
  const summaryItems = useMemo(() => {
    if (!summaryCards || summaryCards.length === 0) {
      return []
    }
    return summaryCards.map((item, index) => ({
      ...item,
      positive: item.trend === 'up',
      captionIcon: item.trend === 'up' ? 'arrowUp' : undefined,
      sparkline: summarySparklines[index % summarySparklines.length],
    }))
  }, [summaryCards])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  const toggleStudent = (id) => {
    setSelectedRows((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = students.length > 0 && students.every((student) => selectedRows.has(student.id))

  const toggleVisible = () => {
    setSelectedRows((current) => {
      const next = new Set(current)
      students.forEach((student) => (allVisibleSelected ? next.delete(student.id) : next.add(student.id)))
      return next
    })
  }

  const saveStudent = async (formData) => {
    const source = modal?.student
    if (source) {
      const result = await studentService.updateStudent(source.id, formData)
      if (!result.success) {
        return result
      }
      setModal(null)
      onNotify(`Data siswa ${result.data?.name || formData.name} berhasil diperbarui di database.`)
      setRefreshTrigger((k) => k + 1)
      return { success: true }
    } else {
      const result = await studentService.createStudent(formData)
      if (!result.success) {
        return result
      }
      setModal(null)
      setCurrentPage(1)
      onNotify(`Data siswa ${result.data?.name || formData.name} berhasil ditambahkan ke database.`)
      setRefreshTrigger((k) => k + 1)
      return { success: true }
    }
  }

  const confirmDeleteStudent = async (student) => {
    const result = await studentService.deleteStudent(student.id)
    if (result.success) {
      setSelectedRows((current) => {
        const next = new Set(current)
        next.delete(student.id)
        return next
      })
      setModal(null)
      setOpenMenuId(null)
      onNotify(`Data siswa ${student.name} berhasil dihapus (soft delete).`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(result.error || 'Gagal menghapus data siswa.')
    }
  }

  const archiveStudent = async (student) => {
    const result = await studentService.updateStudent(student.id, { status: 'Nonaktif' })
    if (result.success) {
      setOpenMenuId(null)
      onNotify(`${student.name} berhasil diubah statusnya menjadi Nonaktif.`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(result.error || 'Gagal mengubah status siswa.')
    }
  }

  const startIndex = (meta.current_page - 1) * meta.per_page

  return (
    <>
      {summaryItems.length > 0 && <MasterSummary items={summaryItems} />}

      <section className="master-data-workspace">
        <div className="master-data-toolbar">
          <div className="master-filter-grid student-filters">
            {studentFilterFields.map((field) => (
              <label className="master-field" key={field.key}>
                <span>{field.label}</span>
                <select value={filters[field.key]} onChange={(event) => updateFilter(field.key, event.target.value)}>
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="master-search">
            <SearchInput
              aria-label="Cari NIS, NISN, atau nama siswa"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari NIS / Nama siswa..."
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="master-data-actions">
          <div>{selectedRows.size > 0 && <span className="master-selection-count">{selectedRows.size} data dipilih</span>}</div>
          <div>
            <Button className="master-button secondary" onClick={() => setModal({ type: 'import' })}>
              <Icon name="download" />Import Siswa
            </Button>
            <Button
              className="master-button secondary"
              onClick={() => onNotify('Data siswa siap diekspor. Fitur Excel akan diintegrasikan pada tahap berikutnya.')}
            >
              <Icon name="document" />Export Excel
            </Button>
            <Button className="master-button primary" onClick={() => setModal({ type: 'add' })}>
              <Icon name="plus" />Tambah Siswa
            </Button>
          </div>
        </div>

        <div className="master-table-heading">
          <h3>Daftar Siswa</h3>
          {isLoading && <span style={{ fontSize: '11px', color: '#0aa66a', fontWeight: 600 }}>Memuat data...</span>}
        </div>

        <div className="master-table-scroll">
          <table className="master-student-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Pilih semua siswa pada halaman ini"
                    checked={allVisibleSelected}
                    onChange={toggleVisible}
                    type="checkbox"
                  />
                </th>
                <th>No</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Jenis Kelamin</th>
                <th>Tempat, Tanggal Lahir</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fetchError ? (
                <tr>
                  <td className="master-empty-row" colSpan="10">
                    <Icon name="info" />
                    <strong>Gagal Memuat Data</strong>
                    <span>{fetchError}</span>
                    <div style={{ marginTop: '12px' }}>
                      <Button className="master-button primary" onClick={() => setRefreshTrigger((k) => k + 1)} type="button">
                        Coba Lagi
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : isLoading && students.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan="10">
                    <strong>Memuat data siswa dari server...</strong>
                    <span>Mohon tunggu sebentar.</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan="10">
                    <Icon name="search" />
                    <strong>Data tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        aria-label={`Pilih ${student.name}`}
                        checked={selectedRows.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        type="checkbox"
                      />
                    </td>
                    <td>{startIndex + index + 1}</td>
                    <td>{student.nis}</td>
                    <td>{student.nisn}</td>
                    <td className="master-name-cell">{student.name}</td>
                    <td>{student.className}</td>
                    <td>
                      <span className={`master-gender ${student.genderCode === 'P' || student.gender_code === 'P' ? 'female' : 'male'}`}>
                        {student.genderCode || student.gender_code || (student.gender === 'Perempuan' ? 'P' : 'L')}
                      </span>
                    </td>
                    <td>{student.birth}</td>
                    <td>
                      <span className={`master-data-status ${(student.status || 'Aktif').toLowerCase().replaceAll(' ', '-')}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="master-row-actions">
                        <button
                          aria-label={`Lihat ${student.name}`}
                          onClick={() => setModal({ type: 'detail', student })}
                          type="button"
                        >
                          <Icon name="eye" />
                        </button>
                        <button
                          aria-label={`Edit ${student.name}`}
                          onClick={() => setModal({ type: 'edit', student })}
                          type="button"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          aria-label={`Hapus ${student.name}`}
                          className="delete"
                          onClick={() => setModal({ type: 'delete', student })}
                          type="button"
                        >
                          <Icon name="trash" />
                        </button>
                        <span>
                          <button
                            aria-label={`Aksi lainnya ${student.name}`}
                            onClick={() => setOpenMenuId((current) => (current === student.id ? null : student.id))}
                            type="button"
                          >
                            <Icon name="more" />
                          </button>
                          {openMenuId === student.id && (
                            <span className="master-action-menu">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setModal({ type: 'detail', student })
                                }}
                                type="button"
                              >
                                Lihat Detail
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setModal({ type: 'edit', student })
                                }}
                                type="button"
                              >
                                Edit Data
                              </button>
                              <button onClick={() => archiveStudent(student)} type="button">
                                Arsipkan
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setModal({ type: 'delete', student })
                                }}
                                type="button"
                              >
                                Hapus Siswa
                              </button>
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <MasterPagination
          currentPage={meta.current_page}
          itemLabel="siswa"
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
          entityLabel="Siswa"
          onClose={() => setModal(null)}
          onComplete={() => {
            setModal(null)
            onNotify('Fitur import data siswa akan diintegrasikan pada tahap berikutnya.')
          }}
        />
      )}
      {['add', 'edit'].includes(modal?.type) && (
        <MasterEntityModal
          entityLabel="Siswa"
          fields={activeStudentFormFields}
          initialData={modal.student}
          mode={modal.type}
          onClose={() => setModal(null)}
          onSave={saveStudent}
        />
      )}
      {modal?.type === 'detail' && (
        <MasterDetailModal
          entityLabel="Siswa"
          name={modal.student.name}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', student: modal.student })}
          sections={createDetailSections(modal.student)}
        />
      )}
      {modal?.type === 'delete' && (
        <MasterDeleteModal
          entityLabel="Siswa"
          item={modal.student}
          onClose={() => setModal(null)}
          onConfirm={confirmDeleteStudent}
        />
      )}
    </>
  )
}

export default MasterStudentView
