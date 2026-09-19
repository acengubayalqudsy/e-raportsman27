import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  academicOptions,
  homeroomAssignments,
  rombelStudents,
  roomAssignments,
  teacherAssignments,
} from '../../data/akademik.js'
import { masterStudents, masterTeachers } from '../../data/masterData.js'
import AcademicModal from './AcademicModal.jsx'
import AcademicSummary from './AcademicSummary.jsx'

const defaultYear = academicOptions.academicYears.includes('2024/2025')
  ? '2024/2025'
  : academicOptions.academicYears[0]
const defaultSemester = academicOptions.semesters.includes('Genap')
  ? 'Genap'
  : academicOptions.semesters[0]
const defaultClass = academicOptions.classes.includes('X Merdeka 3')
  ? 'X Merdeka 3'
  : academicOptions.classes[0]

function toStatusClass(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getNextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1
}

function getTeacherRecord(name) {
  return masterTeachers.find((teacher) => teacher.name.replace(/,\s*.+$/, '') === name)
}

function AcademicSearch({ ariaLabel, onChange, placeholder, value }) {
  return (
    <label className="academic-search">
      <SearchInput aria-label={ariaLabel} onChange={onChange} placeholder={placeholder} value={value} />
      <Icon name="search" />
    </label>
  )
}

function AcademicField({ label, onChange, options, value }) {
  return (
    <label className="academic-field">
      <span>{label}</span>
      <select onChange={onChange} value={value}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function AcademicEntityModal({
  description,
  fields,
  initialData = {},
  onClose,
  onSave,
  submitLabel = 'Simpan Data',
  title,
  warning,
}) {
  const [formData, setFormData] = useState(() => Object.fromEntries(
    fields.map((field) => [field.key, initialData[field.key] ?? field.defaultValue ?? '']),
  ))

  const submit = (event) => {
    event.preventDefault()
    onSave(formData)
  }

  return (
    <AcademicModal description={description} onClose={onClose} title={title}>
      <form className="academic-entity-form" onSubmit={submit}>
        <div className="academic-form-grid">
          {fields.map((field) => (
            <label className={field.fullWidth ? 'full-width' : ''} key={field.key}>
              <span>{field.label}{field.required && <b>*</b>}</span>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.key]}
                  onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}
                >
                  <option value="">Pilih {field.label}</option>
                  {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  min={field.type === 'number' ? 1 : undefined}
                  required={field.required}
                  type={field.type ?? 'text'}
                  value={formData[field.key]}
                  onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        {warning && <div className="academic-conflict-alert"><Icon name="info" /><span><strong>Bentrok Ruangan</strong>{warning}</span></div>}
        <footer>
          <Button className="academic-button secondary" onClick={onClose}>Batal</Button>
          <Button className="academic-button primary" type="submit"><Icon name="save" />{submitLabel}</Button>
        </footer>
      </form>
    </AcademicModal>
  )
}

function useAcademicPagination(items) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage

  return {
    currentPage: safePage,
    pageItems: items.slice(startIndex, startIndex + rowsPerPage),
    resetPage: () => setCurrentPage(1),
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage: (value) => {
      setRowsPerPage(value)
      setCurrentPage(1)
    },
    startIndex,
    totalPages,
  }
}

function PaginationFooter({ itemLabel, pagination, totalItems }) {
  return (
    <MasterPagination
      currentPage={pagination.currentPage}
      itemLabel={itemLabel}
      onPageChange={pagination.setCurrentPage}
      onRowsPerPageChange={pagination.setRowsPerPage}
      rowsPerPage={pagination.rowsPerPage}
      totalItems={totalItems}
      totalPages={pagination.totalPages}
    />
  )
}

export function AcademicRombelView({ onNotify }) {
  const [members, setMembers] = useState(() => rombelStudents.map((student) => ({ ...student })))
  const [filters, setFilters] = useState({
    academicYear: defaultYear,
    semester: defaultSemester,
    grade: 'X',
    className: defaultClass,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const contextMembers = useMemo(() => members.filter((student) => (
    student.academicYear === filters.academicYear
      && student.semester === filters.semester
      && student.className === filters.className
  )), [filters.academicYear, filters.className, filters.semester, members])

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return contextMembers.filter((student) => !query || [student.nis, student.nisn, student.name]
      .some((value) => String(value ?? '').toLowerCase().includes(query)))
  }, [contextMembers, searchQuery])
  const availableStudents = useMemo(() => {
    const memberIds = new Set(members.map((student) => student.studentId))
    return masterStudents.filter((student) => student.status === 'Aktif' && !memberIds.has(student.id))
  }, [members])

  const pagination = useAcademicPagination(filteredMembers)
  const updateFilter = (key, value) => {
    setFilters((current) => key === 'grade'
      ? {
          ...current,
          grade: value,
          className: academicOptions.classes.find((name) => name.split(' ')[0] === value) ?? current.className,
        }
      : { ...current, [key]: value })
    pagination.resetPage()
  }

  const addMember = (formData) => {
    const student = availableStudents.find((item) => item.name === formData.studentName)
    if (!student) return
    const next = {
      id: getNextId(members),
      membershipId: `RMB-${String(getNextId(members)).padStart(3, '0')}`,
      studentId: student.id,
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      genderCode: student.genderCode,
      status: 'Aktif',
      className: filters.className,
      academicYear: filters.academicYear,
      semester: filters.semester,
    }
    setMembers((current) => [next, ...current])
    setAddOpen(false)
    pagination.resetPage()
    onNotify(`${next.name} berhasil ditambahkan ke ${filters.className}.`)
  }

  const removeMember = (student) => {
    setMembers((current) => current.filter((item) => item.id !== student.id))
    onNotify(`${student.name} dikeluarkan dari ${filters.className} pada local state.`)
  }

  return (
    <>
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid four-fields">
            <AcademicField label="Tahun Ajaran" onChange={(event) => updateFilter('academicYear', event.target.value)} options={academicOptions.academicYears} value={filters.academicYear} />
            <AcademicField label="Semester" onChange={(event) => updateFilter('semester', event.target.value)} options={academicOptions.semesters} value={filters.semester} />
            <AcademicField label="Tingkat" onChange={(event) => updateFilter('grade', event.target.value)} options={academicOptions.grades} value={filters.grade} />
            <AcademicField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={academicOptions.classes.filter((name) => name.split(' ')[0] === filters.grade)} value={filters.className} />
          </div>
          <AcademicSearch ariaLabel="Cari siswa" onChange={(event) => { setSearchQuery(event.target.value); pagination.resetPage() }} placeholder="Cari siswa (NIS/Nama)..." value={searchQuery} />
        </div>

        <div className="academic-actions">
          <div className="academic-context-title"><span><Icon name="users" /></span><div><h3>{filters.className}</h3><p>{contextMembers.length} siswa &middot; {filters.academicYear} &middot; Semester {filters.semester}</p></div></div>
          <Button className="academic-button primary" onClick={() => setAddOpen(true)}><Icon name="plus" />Kelola Anggota Rombel</Button>
        </div>

        <div className="academic-table-scroll">
          <table className="academic-table academic-rombel-table">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>JK</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{pagination.pageItems.length === 0 ? (
              <tr><td className="academic-empty-row" colSpan="6"><Icon name="search" /><strong>Data siswa tidak ditemukan</strong><span>Coba ubah kelas atau kata pencarian.</span></td></tr>
            ) : pagination.pageItems.map((student, index) => (
              <tr key={student.id}><td>{pagination.startIndex + index + 1}</td><td>{student.nis}</td><td className="academic-name-cell">{student.name}</td><td><span className={`academic-gender ${student.genderCode === 'P' ? 'female' : 'male'}`}>{student.genderCode}</span></td><td><span className={`academic-status ${toStatusClass(student.status)}`}>{student.status}</span></td><td><div className="academic-row-actions"><button aria-label={`Keluarkan ${student.name}`} onClick={() => removeMember(student)} type="button"><Icon name="reset" /></button></div></td></tr>
            ))}</tbody>
          </table>
        </div>
        <PaginationFooter itemLabel="siswa" pagination={pagination} totalItems={filteredMembers.length} />
      </section>

      {addOpen && <AcademicEntityModal description={`Pilih siswa dari Master Data untuk dimasukkan ke ${filters.className}.`} fields={[{ key: 'studentName', label: 'Siswa', type: 'select', options: availableStudents.map((student) => student.name), required: true, fullWidth: true }]} onClose={() => setAddOpen(false)} onSave={addMember} submitLabel="Tambah Siswa" title="Tambah Anggota Rombel" />}
    </>
  )
}

export function AcademicTeacherAssignmentView({ onNotify }) {
  const [assignments, setAssignments] = useState(() => teacherAssignments.map((item) => ({ ...item })))
  const [filters, setFilters] = useState({ academicYear: defaultYear, semester: defaultSemester, className: 'Semua Kelas', subject: 'Semua Mata Pelajaran', teacher: 'Semua Guru' })
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return assignments.filter((item) => {
      const matchesSearch = !query || [item.teacher, item.subject, item.className].some((value) => String(value).toLowerCase().includes(query))
      return matchesSearch
        && item.academicYear === filters.academicYear
        && item.semester === filters.semester
        && (filters.className === 'Semua Kelas' || item.className === filters.className)
        && (filters.subject === 'Semua Mata Pelajaran' || item.subject === filters.subject)
        && (filters.teacher === 'Semua Guru' || item.teacher === filters.teacher)
    })
  }, [assignments, filters, searchQuery])
  const pagination = useAcademicPagination(filteredAssignments)
  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); pagination.resetPage() }

  const summary = [
    { title: 'Total Penugasan', value: assignments.length, caption: 'Penugasan aktif', icon: 'clipboard', tone: 'green' },
    { title: 'Guru Ditugaskan', value: new Set(assignments.map((item) => item.teacher)).size, caption: 'Guru pengampu', icon: 'users', tone: 'blue' },
    { title: 'Mata Pelajaran', value: new Set(assignments.map((item) => item.subject)).size, caption: 'Mapel terjadwal', icon: 'book', tone: 'orange' },
    { title: 'Rombel Aktif', value: new Set(assignments.map((item) => item.className)).size, caption: 'Kelas terlayani', icon: 'academic', tone: 'purple' },
  ]

  const saveAssignment = (formData) => {
    const source = modal?.item
    const teacherRecord = getTeacherRecord(formData.teacher)
    const next = {
      ...(source ?? {}),
      ...formData,
      id: source?.id ?? getNextId(assignments),
      teacherId: teacherRecord?.id ?? source?.teacherId,
      nip: teacherRecord?.nip ?? source?.nip ?? '-',
      academicYear: filters.academicYear,
      semester: filters.semester,
      weeklyHours: Number(formData.weeklyHours),
      hoursLabel: `${Number(formData.weeklyHours)} JP`,
      status: 'Aktif',
    }
    setAssignments((current) => source ? current.map((item) => item.id === source.id ? next : item) : [next, ...current])
    setModal(null)
    pagination.resetPage()
    onNotify(`Penugasan ${next.teacher} untuk ${next.subject} berhasil disimpan.`)
  }

  return (
    <>
      <AcademicSummary items={summary} />
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid five-fields">
            <AcademicField label="Tahun Ajaran" onChange={(event) => updateFilter('academicYear', event.target.value)} options={academicOptions.academicYears} value={filters.academicYear} />
            <AcademicField label="Semester" onChange={(event) => updateFilter('semester', event.target.value)} options={academicOptions.semesters} value={filters.semester} />
            <AcademicField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={['Semua Kelas', ...academicOptions.classes]} value={filters.className} />
            <AcademicField label="Mata Pelajaran" onChange={(event) => updateFilter('subject', event.target.value)} options={['Semua Mata Pelajaran', ...academicOptions.subjects]} value={filters.subject} />
            <AcademicField label="Guru" onChange={(event) => updateFilter('teacher', event.target.value)} options={['Semua Guru', ...academicOptions.teachers]} value={filters.teacher} />
          </div>
          <AcademicSearch ariaLabel="Cari guru atau mata pelajaran" onChange={(event) => { setSearchQuery(event.target.value); pagination.resetPage() }} placeholder="Cari guru / mata pelajaran..." value={searchQuery} />
        </div>
        <div className="academic-actions"><div><h3>Daftar Penugasan Guru</h3><p>Relasi guru, mata pelajaran, dan rombongan belajar</p></div><Button className="academic-button primary" onClick={() => setModal({ type: 'add' })}><Icon name="plus" />Tambah Penugasan</Button></div>
        <div className="academic-table-scroll"><table className="academic-table academic-assignment-table"><thead><tr><th>No</th><th>Guru</th><th>Mata Pelajaran</th><th>Kelas</th><th>Jam/Minggu</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{pagination.pageItems.length === 0 ? <tr><td className="academic-empty-row" colSpan="7"><Icon name="search" /><strong>Penugasan tidak ditemukan</strong><span>Coba ubah filter atau kata pencarian.</span></td></tr> : pagination.pageItems.map((item, index) => <tr key={item.id}><td>{pagination.startIndex + index + 1}</td><td className="academic-name-cell"><strong>{item.teacher}</strong><small>{item.nip}</small></td><td>{item.subject}</td><td>{item.className}</td><td><span className="academic-hours">{item.hoursLabel ?? `${item.weeklyHours} JP`}</span></td><td><span className={`academic-status ${toStatusClass(item.status)}`}>{item.status}</span></td><td><div className="academic-row-actions"><button aria-label={`Edit ${item.teacher}`} onClick={() => setModal({ type: 'edit', item })} type="button"><Icon name="edit" /></button></div></td></tr>)}</tbody></table></div>
        <PaginationFooter itemLabel="penugasan" pagination={pagination} totalItems={filteredAssignments.length} />
      </section>
      {modal && <AcademicEntityModal description="Tetapkan guru, mata pelajaran, dan rombongan belajar." fields={[{ key: 'teacher', label: 'Guru', type: 'select', options: academicOptions.teachers, required: true }, { key: 'subject', label: 'Mata Pelajaran', type: 'select', options: academicOptions.subjects, required: true }, { key: 'className', label: 'Rombongan Belajar', type: 'select', options: academicOptions.classes, required: true }, { key: 'weeklyHours', label: 'Jumlah Jam / Minggu', type: 'number', defaultValue: 2, required: true }]} initialData={modal.item} onClose={() => setModal(null)} onSave={saveAssignment} submitLabel="Simpan Penugasan" title={`${modal.type === 'edit' ? 'Edit' : 'Tambah'} Penugasan Guru`} />}
    </>
  )
}

export function AcademicHomeroomView({ onNotify }) {
  const [assignments, setAssignments] = useState(() => homeroomAssignments.map((item) => ({ ...item })))
  const [filters, setFilters] = useState({ academicYear: defaultYear, grade: 'Semua Tingkat', className: 'Semua Kelas' })
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)
  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return assignments.filter((item) => item.academicYear === filters.academicYear
      && (filters.grade === 'Semua Tingkat' || item.grade === filters.grade)
      && (filters.className === 'Semua Kelas' || item.className === filters.className)
      && (!query || [item.className, item.teacher, item.nip].some((value) => String(value).toLowerCase().includes(query))))
  }, [assignments, filters, searchQuery])
  const pagination = useAcademicPagination(filteredAssignments)
  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); pagination.resetPage() }

  const saveAssignment = (formData) => {
    const source = modal?.item
    const existing = assignments.find((item) => item.className === formData.className && item.academicYear === filters.academicYear)
    if (source && existing && existing.id !== source.id) {
      onNotify(`${formData.className} sudah memiliki wali kelas. Pilih kelas lain.`)
      return
    }
    const target = source ?? existing
    const teacherRecord = getTeacherRecord(formData.teacher)
    const next = {
      ...(target ?? {}),
      ...formData,
      id: target?.id ?? getNextId(assignments),
      grade: formData.className.split(' ')[0],
      teacherId: teacherRecord?.id ?? target?.teacherId,
      nip: teacherRecord?.nip ?? target?.nip ?? '-',
      studentCount: Number(formData.studentCount) || target?.studentCount || 0,
      academicYear: filters.academicYear,
      status: 'Aktif',
    }
    setAssignments((current) => target ? current.map((item) => item.id === target.id ? next : item) : [next, ...current])
    setModal(null)
    pagination.resetPage()
    onNotify(`${next.teacher} ditetapkan sebagai wali kelas ${next.className}.`)
  }

  return (
    <>
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid three-fields"><AcademicField label="Tahun Ajaran" onChange={(event) => updateFilter('academicYear', event.target.value)} options={academicOptions.academicYears} value={filters.academicYear} /><AcademicField label="Tingkat" onChange={(event) => updateFilter('grade', event.target.value)} options={['Semua Tingkat', ...academicOptions.grades]} value={filters.grade} /><AcademicField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={['Semua Kelas', ...academicOptions.classes]} value={filters.className} /></div>
          <AcademicSearch ariaLabel="Cari kelas atau wali kelas" onChange={(event) => { setSearchQuery(event.target.value); pagination.resetPage() }} placeholder="Cari kelas / wali kelas..." value={searchQuery} />
        </div>
        <div className="academic-actions"><div><h3>Penugasan Wali Kelas</h3><p>Wali kelas berasal dari Data Guru</p></div><Button className="academic-button primary" onClick={() => setModal({ type: 'add' })}><Icon name="plus" />Atur Wali Kelas</Button></div>
        <div className="academic-table-scroll"><table className="academic-table academic-homeroom-table"><thead><tr><th>No</th><th>Kelas</th><th>Wali Kelas</th><th>NIP</th><th>Jumlah Siswa</th><th>Tahun Ajaran</th><th>Aksi</th></tr></thead><tbody>{pagination.pageItems.length === 0 ? <tr><td className="academic-empty-row" colSpan="7"><Icon name="search" /><strong>Penugasan tidak ditemukan</strong><span>Coba ubah filter atau kata pencarian.</span></td></tr> : pagination.pageItems.map((item, index) => <tr key={item.id}><td>{pagination.startIndex + index + 1}</td><td className="academic-name-cell">{item.className}</td><td>{item.teacher}</td><td>{item.nip}</td><td><span className="academic-count-badge">{item.studentCount} siswa</span></td><td>{item.academicYear}</td><td><div className="academic-row-actions"><button aria-label={`Edit wali kelas ${item.className}`} onClick={() => setModal({ type: 'edit', item })} type="button"><Icon name="edit" /></button></div></td></tr>)}</tbody></table></div>
        <PaginationFooter itemLabel="kelas" pagination={pagination} totalItems={filteredAssignments.length} />
      </section>
      {modal && <AcademicEntityModal description="Satu kelas hanya memiliki satu wali kelas pada tahun ajaran aktif." fields={[{ key: 'className', label: 'Rombongan Belajar', type: 'select', options: academicOptions.classes, required: true }, { key: 'teacher', label: 'Guru', type: 'select', options: academicOptions.teachers, required: true }, { key: 'studentCount', label: 'Jumlah Siswa', type: 'number', defaultValue: 36, required: true }]} initialData={modal.item} onClose={() => setModal(null)} onSave={saveAssignment} submitLabel="Simpan Penugasan" title={`${modal.type === 'edit' ? 'Edit' : 'Atur'} Wali Kelas`} />}
    </>
  )
}

export function AcademicRoomAllocationView({ onNotify }) {
  const [allocations, setAllocations] = useState(() => roomAssignments.map((item) => ({ ...item })))
  const [filters, setFilters] = useState({ day: 'Semua Hari', className: 'Semua Kelas', room: 'Semua Ruangan', status: 'Semua Status' })
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [conflict, setConflict] = useState('')
  const dayOptions = academicOptions.days.filter((day) => day !== 'Semua Hari')

  const filteredAllocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return allocations.filter((item) => (filters.day === 'Semua Hari' || item.day === filters.day)
      && (filters.className === 'Semua Kelas' || item.className === filters.className)
      && (filters.room === 'Semua Ruangan' || item.room === filters.room)
      && (filters.status === 'Semua Status' || item.status === filters.status)
      && (!query || [item.subject, item.teacher, item.className, item.room].some((value) => String(value ?? '').toLowerCase().includes(query))))
  }, [allocations, filters, searchQuery])
  const pagination = useAcademicPagination(filteredAllocations)
  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); pagination.resetPage() }

  const saveAllocation = (formData) => {
    const source = modal?.item
    const existing = formData.status !== 'Tidak Aktif'
      ? allocations.find((item) => item.id !== source?.id
        && item.status !== 'Tidak Aktif'
        && item.day === formData.day
        && item.time === formData.time
        && item.room === formData.room)
      : null
    if (existing) {
      setConflict(`${formData.room} sudah digunakan oleh ${existing.className} untuk ${existing.subject} pada waktu yang sama.`)
      return
    }
    const next = { ...(source ?? {}), ...formData, id: source?.id ?? getNextId(allocations), status: formData.status || 'Aktif', conflict: false }
    setAllocations((current) => source ? current.map((item) => item.id === source.id ? next : item) : [next, ...current])
    setModal(null)
    setConflict('')
    pagination.resetPage()
    onNotify(`Pembagian ${next.room} untuk ${next.className} berhasil disimpan.`)
  }

  const openModal = (type, item) => { setConflict(''); setModal({ type, item }) }
  const detectedConflicts = allocations.filter((item) => item.conflict).length

  return (
    <>
      {detectedConflicts > 0 && <div className="academic-page-alert"><Icon name="info" /><div><strong>{detectedConflicts} bentrok ruangan terdeteksi</strong><span>Periksa alokasi ruangan pada hari dan jam yang sama.</span></div></div>}
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid four-fields"><AcademicField label="Hari" onChange={(event) => updateFilter('day', event.target.value)} options={['Semua Hari', ...dayOptions]} value={filters.day} /><AcademicField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={['Semua Kelas', ...academicOptions.classes]} value={filters.className} /><AcademicField label="Ruangan" onChange={(event) => updateFilter('room', event.target.value)} options={['Semua Ruangan', ...academicOptions.rooms]} value={filters.room} /><AcademicField label="Status" onChange={(event) => updateFilter('status', event.target.value)} options={['Semua Status', ...academicOptions.statuses]} value={filters.status} /></div>
          <AcademicSearch ariaLabel="Cari alokasi ruangan" onChange={(event) => { setSearchQuery(event.target.value); pagination.resetPage() }} placeholder="Cari kelas / mapel / ruangan..." value={searchQuery} />
        </div>
        <div className="academic-actions"><div><h3>Pembagian Ruangan</h3><p>Atur pemakaian ruang untuk jadwal pembelajaran</p></div><Button className="academic-button primary" onClick={() => openModal('add')}><Icon name="plus" />Tambah Alokasi</Button></div>
        <div className="academic-table-scroll"><table className="academic-table academic-room-table"><thead><tr><th>No</th><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Ruangan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{pagination.pageItems.length === 0 ? <tr><td className="academic-empty-row" colSpan="8"><Icon name="search" /><strong>Alokasi tidak ditemukan</strong><span>Coba ubah filter atau kata pencarian.</span></td></tr> : pagination.pageItems.map((item, index) => { const hasConflict = Boolean(item.conflict); return <tr className={hasConflict ? 'has-conflict' : ''} key={item.id}><td>{pagination.startIndex + index + 1}</td><td>{item.day}</td><td>{item.time}</td><td className="academic-name-cell">{item.className}</td><td>{item.subject}</td><td><span className="academic-room-badge">{item.room}</span></td><td><span className={`academic-status ${hasConflict ? 'conflict' : toStatusClass(item.status)}`}>{hasConflict ? 'Bentrok Ruangan' : item.status}</span></td><td><div className="academic-row-actions"><button aria-label={`Edit alokasi ${item.className}`} onClick={() => openModal('edit', item)} type="button"><Icon name="edit" /></button></div></td></tr> })}</tbody></table></div>
        <PaginationFooter itemLabel="alokasi" pagination={pagination} totalItems={filteredAllocations.length} />
      </section>
      {modal && <AcademicEntityModal description="Sistem akan memeriksa bentrok ruangan pada local state." fields={[{ key: 'day', label: 'Hari', type: 'select', options: dayOptions, required: true }, { key: 'time', label: 'Jam', type: 'select', options: academicOptions.timeSlots, required: true }, { key: 'className', label: 'Kelas', type: 'select', options: academicOptions.classes, required: true }, { key: 'subject', label: 'Mata Pelajaran', type: 'select', options: academicOptions.subjects, required: true }, { key: 'room', label: 'Ruangan', type: 'select', options: academicOptions.rooms, required: true }, { key: 'status', label: 'Status', type: 'select', options: academicOptions.statuses, defaultValue: 'Aktif', required: true }]} initialData={modal.item ? { ...modal.item, status: modal.item.status === 'Bentrok' ? 'Aktif' : modal.item.status } : undefined} onClose={() => { setModal(null); setConflict('') }} onSave={saveAllocation} submitLabel="Simpan Alokasi" title={`${modal.type === 'edit' ? 'Edit' : 'Tambah'} Pembagian Ruangan`} warning={conflict} />}
    </>
  )
}
