import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  activityOptions,
  cocurricularNotes,
  homeroomNotes,
  participations as initialParticipations,
  scores,
} from '../../data/kegiatanSiswa.js'

const initialFilters = {
  className: 'Semua Kelas',
  academicYear: '2024/2025',
  semester: 'Genap',
  extracurricular: 'Semua Ekskul',
  status: 'Semua Status',
}

const popularActivities = [
  { name: 'Pramuka', members: 182, percentage: '21,62%', bar: 62 },
  { name: 'Futsal', members: 156, percentage: '18,53%', bar: 53 },
  { name: 'Paskibra', members: 98, percentage: '11,66%', bar: 36 },
  { name: 'Rohis', members: 86, percentage: '10,21%', bar: 31 },
  { name: 'PMR', members: 72, percentage: '8,55%', bar: 25 },
]

const upcomingActivities = [
  { day: '15', month: 'MEI', title: 'Lomba Pramuka Tingkat Kabupaten', time: '08:00 - 16:00 WIB', place: 'Lapangan Setda Garut' },
  { day: '20', month: 'MEI', title: 'Latihan Paskibra Persiapan Upacara', time: '15:30 - 17:30 WIB', place: 'Lapangan Sekolah' },
  { day: '25', month: 'MEI', title: 'Turnamen Futsal Antar Kelas', time: '07:00 - 18:00 WIB', place: 'GOR SMAN 27 Garut' },
]

function ActivityModal({ children, description, onClose, title, wide = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    return () => previousFocus?.focus?.()
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') onClose()
  }

  return (
    <div
      className="activity-modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <section
        aria-labelledby="activity-modal-title"
        aria-modal="true"
        className={`activity-modal${wide ? ' activity-modal-wide' : ''}`}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="activity-modal-header">
          <div>
            <h3 id="activity-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )
}

function ParticipationFormModal({ initialData, mode, onClose, onSave, participations }) {
  const [formData, setFormData] = useState(() => ({
    studentId: initialData?.studentId ? String(initialData.studentId) : '',
    extracurricular: initialData?.extracurricular ?? '',
    academicYear: initialData?.academicYear ?? '2024/2025',
    semester: initialData?.semester ?? 'Genap',
    yearJoined: initialData?.yearJoined ?? '2024',
    status: initialData?.status ?? 'Aktif',
  }))
  const [error, setError] = useState('')

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const hasEmptyField = Object.values(formData).some((value) => !String(value).trim())

    if (hasEmptyField) {
      setError('Lengkapi seluruh data keikutsertaan sebelum menyimpan.')
      return
    }

    if (!/^\d{4}$/.test(formData.yearJoined)) {
      setError('Tahun gabung harus terdiri dari 4 digit angka.')
      return
    }

    const duplicate = participations.some((participation) => (
      participation.id !== initialData?.id
      && String(participation.studentId) === String(formData.studentId)
      && participation.extracurricular === formData.extracurricular
      && participation.academicYear === formData.academicYear
    ))

    if (duplicate) {
      setError('Siswa sudah terdaftar pada ekstrakurikuler dan tahun ajaran yang sama.')
      return
    }

    onSave(formData)
  }

  return (
    <ActivityModal
      description="Data tersimpan sementara pada tampilan ini."
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Keikutsertaan' : 'Tambah Keikutsertaan'}
    >
      <form className="activity-modal-form" onSubmit={handleSubmit}>
        {error && (
          <div className="activity-form-alert" role="alert">
            <Icon name="info" />
            <span>{error}</span>
          </div>
        )}

        <div className="activity-form-grid">
          <label className="activity-field activity-field-full">
            <span>Siswa</span>
            <select
              aria-label="Pilih siswa"
              onChange={(event) => updateField('studentId', event.target.value)}
              value={formData.studentId}
            >
              <option value="">Pilih siswa</option>
              {activityOptions.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nis} - {student.name} ({student.className})
                </option>
              ))}
            </select>
          </label>

          <label className="activity-field activity-field-full">
            <span>Ekstrakurikuler</span>
            <select
              aria-label="Pilih ekstrakurikuler"
              onChange={(event) => updateField('extracurricular', event.target.value)}
              value={formData.extracurricular}
            >
              <option value="">Pilih ekstrakurikuler</option>
              {activityOptions.extracurricularOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label} - {option.supervisor}
                </option>
              ))}
            </select>
          </label>

          <label className="activity-field">
            <span>Tahun Ajaran</span>
            <select
              onChange={(event) => updateField('academicYear', event.target.value)}
              value={formData.academicYear}
            >
              {activityOptions.academicYears.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="activity-field">
            <span>Semester</span>
            <select
              onChange={(event) => updateField('semester', event.target.value)}
              value={formData.semester}
            >
              {activityOptions.semesters.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="activity-field">
            <span>Tahun Gabung</span>
            <input
              inputMode="numeric"
              maxLength="4"
              onChange={(event) => updateField('yearJoined', event.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 2024"
              value={formData.yearJoined}
            />
          </label>

          <label className="activity-field">
            <span>Status</span>
            <select onChange={(event) => updateField('status', event.target.value)} value={formData.status}>
              {activityOptions.participationStatuses.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <footer className="activity-modal-actions">
          <Button className="activity-button activity-button-secondary" onClick={onClose}>Batal</Button>
          <Button className="activity-button activity-button-primary" type="submit">
            <Icon name="save" />
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Keikutsertaan'}
          </Button>
        </footer>
      </form>
    </ActivityModal>
  )
}

function ParticipationDetailModal({ onClose, onEdit, participation, studentParticipations }) {
  const studentScores = scores.filter((item) => String(item.studentId) === String(participation.studentId))
  const cocurricularNote = cocurricularNotes.find((item) => String(item.studentId) === String(participation.studentId))
  const homeroomNote = homeroomNotes.find((item) => String(item.studentId) === String(participation.studentId))

  return (
    <ActivityModal
      description={`${participation.nis} - ${participation.className}`}
      onClose={onClose}
      title={participation.name}
      wide
    >
      <div className="activity-detail-content">
        <div className="activity-detail-grid">
          <div><span>Ekstrakurikuler</span><strong>{participation.extracurricular}</strong></div>
          <div><span>Pembina</span><strong>{participation.supervisor}</strong></div>
          <div><span>Tahun Ajaran</span><strong>{participation.academicYear}</strong></div>
          <div><span>Semester</span><strong>{participation.semester}</strong></div>
          <div><span>Tahun Gabung</span><strong>{participation.yearJoined}</strong></div>
          <div><span>Status</span><strong>{participation.status}</strong></div>
        </div>

        <section className="activity-detail-list">
          <div className="activity-detail-heading">
            <div>
              <h4>Ringkasan Keikutsertaan</h4>
              <p>{studentParticipations.length} kegiatan ekstrakurikuler tercatat.</p>
            </div>
          </div>
          {studentParticipations.map((item) => (
            <article key={item.id}>
              <span className="activity-detail-icon"><Icon name="award" /></span>
              <div>
                <strong>{item.extracurricular}</strong>
                <span>
                  Predikat {studentScores.find((score) => score.participationId === item.id)?.predicate || '-'} · {item.supervisor}
                </span>
              </div>
              <span className={`activity-status ${item.status === 'Aktif' ? 'activity-status-active' : 'activity-status-inactive'}`}>
                {item.status}
              </span>
            </article>
          ))}
        </section>

        <section className="activity-detail-notes">
          <article>
            <h4>Catatan Kokurikuler</h4>
            <p>{cocurricularNote?.note || 'Belum ada catatan kokurikuler untuk siswa ini.'}</p>
          </article>
          <article>
            <h4>Catatan Wali Kelas</h4>
            <p>{homeroomNote?.note || 'Belum ada catatan wali kelas untuk siswa ini.'}</p>
          </article>
        </section>
      </div>

      <footer className="activity-modal-actions">
        <Button className="activity-button activity-button-secondary" onClick={onClose}>Tutup</Button>
        <Button className="activity-button activity-button-primary" onClick={onEdit}>
          <Icon name="edit" />Edit Keikutsertaan
        </Button>
      </footer>
    </ActivityModal>
  )
}

function StudentParticipationView({ onNotify = () => {} }) {
  const [participations, setParticipations] = useState(() => initialParticipations.map((item) => ({ ...item })))
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modal, setModal] = useState(null)

  const filteredParticipations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return participations.filter((participation) => {
      const matchesSearch = !query || [participation.nis, participation.name]
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesClass = filters.className === 'Semua Kelas' || participation.className === filters.className
      const matchesYear = filters.academicYear === 'Semua Tahun' || participation.academicYear === filters.academicYear
      const matchesSemester = filters.semester === 'Semua Semester' || participation.semester === filters.semester
      const matchesActivity = filters.extracurricular === 'Semua Ekskul'
        || participation.extracurricular === filters.extracurricular
      const matchesStatus = filters.status === 'Semua Status' || participation.status === filters.status

      return matchesSearch && matchesClass && matchesYear && matchesSemester && matchesActivity && matchesStatus
    })
  }, [filters, participations, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredParticipations.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleParticipations = filteredParticipations.slice(startIndex, startIndex + rowsPerPage)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
    setOpenMenuId(null)
  }

  const saveParticipation = (formData) => {
    const source = modal?.participation
    const student = activityOptions.students.find((item) => String(item.id) === String(formData.studentId))
    const activity = activityOptions.extracurricularOptions.find((item) => item.value === formData.extracurricular)
    const nextId = source?.id ?? Math.max(0, ...participations.map((item) => Number(item.id) || 0)) + 1
    const nextParticipation = {
      ...(source ?? {}),
      id: nextId,
      participationId: source?.participationId ?? `KSE-${String(nextId).padStart(3, '0')}`,
      studentId: student.id,
      nis: student.nis,
      name: student.name,
      studentName: student.name,
      className: student.className,
      extracurricular: activity.value,
      extracurricularName: activity.value,
      extracurricularId: activity.id,
      supervisor: activity.supervisor,
      academicYear: formData.academicYear,
      semester: formData.semester,
      yearJoined: formData.yearJoined,
      joinYear: formData.yearJoined,
      status: formData.status,
    }

    setParticipations((current) => source
      ? current.map((item) => item.id === source.id ? nextParticipation : item)
      : [nextParticipation, ...current])
    setModal(null)
    setOpenMenuId(null)
    setCurrentPage(1)
    onNotify(`Keikutsertaan ${nextParticipation.name} berhasil ${source ? 'diperbarui' : 'ditambahkan'}.`)
  }

  const toggleParticipationStatus = (participation) => {
    const nextStatus = participation.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif'
    setParticipations((current) => current.map((item) => (
      item.id === participation.id ? { ...item, status: nextStatus } : item
    )))
    setOpenMenuId(null)
    onNotify(`${participation.name} kini berstatus ${nextStatus} pada ${participation.extracurricular}.`)
  }

  const showDetail = (participation) => {
    setOpenMenuId(null)
    setModal({ type: 'detail', participation })
  }

  const filterFields = [
    { key: 'className', label: 'Kelas', options: ['Semua Kelas', ...activityOptions.classes] },
    { key: 'academicYear', label: 'Tahun Ajaran', options: ['Semua Tahun', ...activityOptions.academicYears] },
    { key: 'semester', label: 'Semester', options: ['Semua Semester', ...activityOptions.semesters] },
    { key: 'extracurricular', label: 'Ekstrakurikuler', options: ['Semua Ekskul', ...activityOptions.extracurriculars] },
    { key: 'status', label: 'Status', options: activityOptions.participationStatusFilters },
  ]

  return (
    <>
      <section className="activity-filter-card">
        <div className="activity-toolbar">
          <div className="activity-filter-grid activity-participation-filters">
            {filterFields.map((field) => (
              <label className="activity-field" key={field.key}>
                <span>{field.label}</span>
                <select value={filters[field.key]} onChange={(event) => updateFilter(field.key, event.target.value)}>
                  {field.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>

          <label className="activity-search">
            <SearchInput
              aria-label="Cari NIS atau nama siswa"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
                setOpenMenuId(null)
              }}
              placeholder="Cari siswa (NIS/Nama)..."
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="activity-actions">
          <span className="activity-data-note">
            <Icon name="info" />Data keikutsertaan semester aktif
          </span>
          <div>
            <Button
              className="activity-button activity-button-secondary"
              onClick={() => onNotify(`${filteredParticipations.length.toLocaleString('id-ID')} data keikutsertaan siap diekspor.`)}
            >
              <Icon name="download" />Ekspor Data
            </Button>
            <Button className="activity-button activity-button-primary" onClick={() => setModal({ type: 'add' })}>
              <Icon name="plus" />Tambah Keikutsertaan
            </Button>
          </div>
        </div>
      </section>

      <div className="activity-participation-layout">
        <section className="activity-workspace">

        <div className="activity-table-heading">
          <div>
            <h3>Daftar Keikutsertaan Ekstrakurikuler</h3>
            <p>{filteredParticipations.length.toLocaleString('id-ID')} data sesuai filter</p>
          </div>
        </div>

        <div className="activity-table-scroll">
          <table className="activity-table activity-participation-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Ekstrakurikuler</th>
                <th>Pembina</th>
                <th>Tahun Gabung</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleParticipations.length === 0 ? (
                <tr>
                  <td className="activity-empty-cell" colSpan="9">
                    <EmptyState className="activity-empty-state">
                      <Icon name="search" />
                      <strong>Data tidak ditemukan</strong>
                      <span>Coba ubah filter atau kata pencarian.</span>
                    </EmptyState>
                  </td>
                </tr>
              ) : visibleParticipations.map((participation, index) => (
                <tr key={participation.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>{participation.nis}</td>
                  <td className="activity-name-cell">{participation.name}</td>
                  <td>{participation.className}</td>
                  <td><strong className="activity-primary-cell">{participation.extracurricular}</strong></td>
                  <td>{participation.supervisor}</td>
                  <td>{participation.yearJoined}</td>
                  <td>
                    <span className={`activity-status ${participation.status === 'Aktif' ? 'activity-status-active' : 'activity-status-inactive'}`}>
                      {participation.status}
                    </span>
                  </td>
                  <td>
                    <div className="activity-row-actions">
                      <button aria-label={`Lihat ${participation.name}`} onClick={() => showDetail(participation)} type="button">
                        <Icon name="eye" />
                      </button>
                      <button
                        aria-label={`Edit ${participation.name}`}
                        onClick={() => setModal({ type: 'edit', participation })}
                        type="button"
                      >
                        <Icon name="edit" />
                      </button>
                      <span className="activity-action-menu-wrap">
                        <button
                          aria-expanded={openMenuId === participation.id}
                          aria-label={`Aksi lainnya ${participation.name}`}
                          onClick={() => setOpenMenuId((current) => current === participation.id ? null : participation.id)}
                          type="button"
                        >
                          <Icon name="more" />
                        </button>
                        {openMenuId === participation.id && (
                          <span className="activity-action-menu">
                            <button onClick={() => showDetail(participation)} type="button">Lihat Detail</button>
                            <button onClick={() => setModal({ type: 'edit', participation })} type="button">Edit Data</button>
                            <button onClick={() => toggleParticipationStatus(participation)} type="button">
                              {participation.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan Kembali'}
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
          itemLabel="data"
          onPageChange={(page) => {
            setCurrentPage(page)
            setOpenMenuId(null)
          }}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
            setOpenMenuId(null)
          }}
          rowsPerPage={rowsPerPage}
          totalItems={filteredParticipations.length}
          totalPages={totalPages}
        />
        </section>

        <aside className="activity-participation-sidebar">
          <section className="activity-side-card">
            <header>
              <h3>Ekstrakurikuler Populer</h3>
              <button onClick={() => onNotify('Daftar ekstrakurikuler populer ditampilkan.')} type="button">Lihat Semua</button>
            </header>
            <div className="activity-popular-list">
              {popularActivities.map((item, index) => (
                <article key={item.name}>
                  <b>{index + 1}</b>
                  <span><strong>{item.name}</strong><small>{item.members} siswa aktif</small></span>
                  <i><em style={{ width: `${item.bar}%` }} /></i>
                  <small>{item.percentage}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="activity-side-card">
            <header>
              <h3>Kegiatan Mendatang</h3>
              <button onClick={() => onNotify('Jadwal kegiatan mendatang ditampilkan.')} type="button">Lihat Semua</button>
            </header>
            <div className="activity-upcoming-list">
              {upcomingActivities.map((item) => (
                <article key={`${item.day}-${item.title}`}>
                  <time><b>{item.day}</b><span>{item.month}</span></time>
                  <div>
                    <strong>{item.title}</strong>
                    <small><Icon name="clock" />{item.time}</small>
                    <small><Icon name="layers" />{item.place}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {['add', 'edit'].includes(modal?.type) && (
        <ParticipationFormModal
          initialData={modal.participation}
          mode={modal.type}
          onClose={() => setModal(null)}
          onSave={saveParticipation}
          participations={participations}
        />
      )}

      {modal?.type === 'detail' && (
        <ParticipationDetailModal
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', participation: modal.participation })}
          participation={modal.participation}
          studentParticipations={participations.filter((item) => (
            String(item.studentId) === String(modal.participation.studentId)
          ))}
        />
      )}
    </>
  )
}

export default StudentParticipationView
