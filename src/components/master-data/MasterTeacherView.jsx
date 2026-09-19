import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  masterOptions,
  masterSchemas,
  masterTeachers,
  teacherSummary,
} from '../../data/masterData.js'
import { MasterDetailModal, MasterEntityModal, MasterImportModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import MasterSummary from './MasterSummary.jsx'

const summarySparklines = [
  'M0 27 C7 23 11 14 17 18 C24 22 29 7 36 10 C43 13 47 5 52 8',
  'M0 28 C6 21 11 23 17 15 C23 8 29 17 36 11 C43 5 47 12 52 7',
  'M0 25 C7 27 10 13 18 14 C25 15 29 22 36 16 C43 10 47 17 52 12',
  'M0 27 C8 19 12 23 18 17 C25 10 31 20 38 12 C44 5 48 11 52 8',
  'M0 28 C7 18 12 22 19 15 C26 8 31 19 38 13 C44 7 48 5 52 9',
]

const teacherFormFields = masterSchemas.guru.formFields.map((field) => ({
  ...field,
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

function formatBirth(place, dateValue) {
  if (!dateValue) return place || '-'
  const date = new Date(`${dateValue}T00:00:00`)
  const formatted = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replaceAll('.', '')

  return `${place || 'Garut'}, ${formatted}`
}

function getInitials(name) {
  return name
    .replace(/,.*$/, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatPercentage(value, total) {
  if (total === 0) return '0%'

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
        { label: 'NIP', value: teacher.nip },
        { label: 'NUPTK', value: teacher.nuptk },
        { label: 'Tempat, Tanggal Lahir', value: teacher.birth },
        { label: 'Jenis Kelamin', value: teacher.gender },
        { label: 'Status', value: teacher.status },
      ],
    },
    {
      title: 'Kontak & Domisili',
      items: [
        { label: 'Nomor Telepon', value: teacher.phone },
        { label: 'Email', value: teacher.email },
        { label: 'Alamat', value: teacher.address },
      ],
    },
    {
      title: 'Data Kepegawaian',
      items: [
        { label: 'Status Kepegawaian', value: teacher.employmentStatus },
        { label: 'Mata Pelajaran Utama', value: teacher.subject },
      ],
    },
  ]
}

function MasterTeacherView({ onNotify }) {
  const [teachers, setTeachers] = useState(() => masterTeachers.map((teacher) => ({ ...teacher })))
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [selectedRows, setSelectedRows] = useState(() => new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modal, setModal] = useState(null)

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return teachers.filter((teacher) => {
      const matchesSearch = !query || [teacher.name, teacher.nip, teacher.nuptk]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
      const matchesStatus = filters.status === 'Semua Status' || teacher.status === filters.status
      const matchesGender = filters.gender === 'Semua' || teacher.gender === filters.gender
      const matchesEmployment = filters.employmentStatus === 'Semua Kepegawaian'
        || teacher.employmentStatus === filters.employmentStatus
      const matchesSubject = filters.subject === 'Semua Mata Pelajaran' || teacher.subject === filters.subject

      return matchesSearch && matchesStatus && matchesGender && matchesEmployment && matchesSubject
    })
  }, [filters, searchQuery, teachers])

  const summaryItems = useMemo(() => {
    const total = teachers.length
    const counts = {
      'Total Guru': total,
      'Guru Aktif': teachers.filter((teacher) => teacher.status === 'Aktif').length,
      'Laki-laki': teachers.filter((teacher) => teacher.gender === 'Laki-laki').length,
      Perempuan: teachers.filter((teacher) => teacher.gender === 'Perempuan').length,
      'Guru ASN': teachers.filter((teacher) => teacher.employmentStatus === 'ASN').length,
    }

    return teacherSummary.map((item, index) => {
      const value = counts[item.title] ?? 0
      const caption = item.title === 'Total Guru' ? item.caption : formatPercentage(value, total)
      return {
        ...item,
        caption,
        sparkline: summarySparklines[index],
        value: value.toLocaleString('id-ID'),
      }
    })
  }, [teachers])

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleTeachers = filteredTeachers.slice(startIndex, startIndex + rowsPerPage)
  const allVisibleSelected = visibleTeachers.length > 0
    && visibleTeachers.every((teacher) => selectedRows.has(teacher.id))

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

  const toggleVisibleTeachers = () => {
    setSelectedRows((current) => {
      const next = new Set(current)
      visibleTeachers.forEach((teacher) => {
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

  const saveTeacher = (formData) => {
    const source = modal?.teacher
    const name = formData.name.trim()
    const nextTeacher = {
      ...(source ?? {}),
      ...formData,
      id: source?.id ?? Math.max(0, ...teachers.map((teacher) => teacher.id)) + 1,
      name,
      avatar: getInitials(name),
      birth: formatBirth(formData.birthPlace, formData.birthDate),
      gender: formData.gender || source?.gender || 'Laki-laki',
      genderCode: (formData.gender || source?.gender) === 'Perempuan' ? 'P' : 'L',
      employmentStatus: formData.employmentStatus || source?.employmentStatus || 'ASN',
      subject: formData.subject || source?.subject || masterOptions.subjects[0],
      status: formData.status || source?.status || 'Aktif',
    }

    setTeachers((current) => source
      ? current.map((teacher) => teacher.id === source.id ? nextTeacher : teacher)
      : [nextTeacher, ...current])
    setModal(null)
    setCurrentPage(1)
    onNotify(`Data ${nextTeacher.name} berhasil ${source ? 'diperbarui' : 'ditambahkan'}.`)
  }

  const toggleTeacherStatus = (teacher) => {
    const nextStatus = teacher.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif'
    setTeachers((current) => current.map((item) => (
      item.id === teacher.id ? { ...item, status: nextStatus } : item
    )))
    setOpenMenuId(null)
    onNotify(`Status ${teacher.name} diubah menjadi ${nextStatus}.`)
  }

  const changeBulkStatus = () => {
    setTeachers((current) => current.map((teacher) => (
      selectedRows.has(teacher.id)
        ? { ...teacher, status: teacher.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif' }
        : teacher
    )))
    onNotify(`Status ${selectedRows.size} data guru berhasil diperbarui.`)
    setSelectedRows(new Set())
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
              <button onClick={changeBulkStatus} type="button">Ubah Status</button>
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

        <div className="master-table-heading"><h3>Daftar Guru</h3></div>
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
              {visibleTeachers.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan="9">
                    <Icon name="search" />
                    <strong>Data tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : visibleTeachers.map((teacher, index) => (
                <tr key={teacher.id}>
                  <td>
                    <input
                      aria-label={`Pilih ${teacher.name}`}
                      checked={selectedRows.has(teacher.id)}
                      onChange={() => toggleTeacher(teacher.id)}
                      type="checkbox"
                    />
                  </td>
                  <td>{startIndex + index + 1}</td>
                  <td className="master-name-cell">{teacher.name}</td>
                  <td className="master-nip-cell">
                    <strong>{teacher.nip}</strong>
                    <small>{teacher.nuptk}</small>
                  </td>
                  <td>
                    <span className={`master-gender ${teacher.genderCode === 'P' ? 'female' : 'male'}`}>
                      {teacher.genderCode}
                    </span>
                  </td>
                  <td>{teacher.subject}</td>
                  <td>
                    <span className={`master-employment-status ${teacher.employmentStatus.toLowerCase()}`}>
                      {teacher.employmentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`master-data-status ${teacher.status.toLowerCase().replaceAll(' ', '-')}`}>
                      {teacher.status}
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
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <MasterPagination
          currentPage={safePage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
          }}
          rowsPerPage={rowsPerPage}
          totalItems={filteredTeachers.length}
          totalPages={totalPages}
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
    </>
  )
}

export default MasterTeacherView
