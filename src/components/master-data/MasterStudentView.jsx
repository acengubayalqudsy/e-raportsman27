import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  masterOptions,
  masterSchemas,
  masterStudents,
  studentSummary,
} from '../../data/masterData.js'
import { MasterDetailModal, MasterEntityModal, MasterImportModal } from './MasterModals.jsx'
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

function formatBirth(place, dateValue) {
  if (!dateValue) return place || '-'
  const date = new Date(`${dateValue}T00:00:00`)
  const formatted = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replaceAll('.', '')
  return `${place || 'Garut'}, ${formatted}`
}

function createDetailSections(student) {
  return [
    { title: 'Identitas', items: [{ label: 'NIS', value: student.nis }, { label: 'NISN', value: student.nisn }, { label: 'Tempat, Tanggal Lahir', value: student.birth }, { label: 'Jenis Kelamin', value: student.gender }, { label: 'Agama', value: student.religion }, { label: 'Status', value: student.status }] },
    { title: 'Data Akademik & Domisili', items: [{ label: 'Kelas', value: student.className }, { label: 'Sekolah Asal', value: student.previousSchool }, { label: 'Tanggal Diterima', value: student.admissionDate }, { label: 'Alamat', value: student.address }, { label: 'Nomor Telepon', value: student.phone }] },
    { title: 'Orang Tua', items: [{ label: 'Nama Ayah', value: student.fatherName }, { label: 'Nama Ibu', value: student.motherName }, { label: 'Pekerjaan Ayah', value: student.fatherOccupation }, { label: 'Pekerjaan Ibu', value: student.motherOccupation }, { label: 'Telepon Orang Tua', value: student.parentPhone }] },
    { title: 'Data Wali', items: [{ label: 'Nama Wali', value: student.guardianName }, { label: 'Alamat Wali', value: student.guardianAddress }, { label: 'Telepon Wali', value: student.guardianPhone }] },
  ]
}

function MasterStudentView({ onNotify }) {
  const [students, setStudents] = useState(() => masterStudents.map((student) => ({ ...student })))
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [selectedRows, setSelectedRows] = useState(() => new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modal, setModal] = useState(null)

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch = !query || [student.nis, student.nisn, student.name].some((value) => value.toLowerCase().includes(query))
      const matchesClass = filters.className === 'Semua Kelas' || student.className === filters.className
      const matchesGrade = filters.grade === 'Semua Tingkat' || student.grade === filters.grade
      const matchesGroup = filters.studyGroup === 'Semua Rombel' || student.studyGroup === filters.studyGroup
      const matchesStatus = ['Siswa Aktif', 'Semua Status'].includes(filters.status) || student.status === filters.status
      const matchesGender = filters.gender === 'Semua' || student.gender === filters.gender
      return matchesSearch && matchesClass && matchesGrade && matchesGroup && matchesStatus && matchesGender
    })
  }, [filters, searchQuery, students])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage)
  const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every((student) => selectedRows.has(student.id))
  const summaryItems = studentSummary.map((item, index) => ({ ...item, positive: item.trend === 'up', captionIcon: item.trend === 'up' ? 'arrowUp' : undefined, sparkline: summarySparklines[index] }))

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

  const toggleVisible = () => {
    setSelectedRows((current) => {
      const next = new Set(current)
      visibleStudents.forEach((student) => allVisibleSelected ? next.delete(student.id) : next.add(student.id))
      return next
    })
  }

  const saveStudent = (formData) => {
    const source = modal?.student
    const className = formData.className || formData.acceptedClass || 'X Merdeka 3'
    const nextStudent = {
      ...(source ?? {}),
      ...formData,
      id: source?.id ?? Math.max(...students.map((student) => student.id)) + 1,
      name: formData.name.toUpperCase(),
      className,
      grade: className.split(' ')[0],
      studyGroup: className.replace(`${className.split(' ')[0]} `, ''),
      genderCode: formData.gender === 'Perempuan' ? 'P' : 'L',
      birth: formatBirth(formData.birthPlace, formData.birthDate),
      avatar: formData.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
    }

    setStudents((current) => source ? current.map((student) => student.id === source.id ? nextStudent : student) : [nextStudent, ...current])
    setModal(null)
    setCurrentPage(1)
    onNotify(`Data ${nextStudent.name} berhasil ${source ? 'diperbarui' : 'ditambahkan'}.`)
  }

  const archiveStudent = (student) => {
    setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: 'Tidak Aktif' } : item))
    setOpenMenuId(null)
    onNotify(`${student.name} dipindahkan ke status Tidak Aktif.`)
  }

  const changeBulkStatus = () => {
    setStudents((current) => current.map((student) => selectedRows.has(student.id) ? { ...student, status: 'Tidak Aktif' } : student))
    onNotify(`${selectedRows.size} data siswa berhasil diperbarui.`)
    setSelectedRows(new Set())
  }

  return (
    <>
      <MasterSummary items={summaryItems} />
      <section className="master-data-workspace">
        <div className="master-data-toolbar">
          <div className="master-filter-grid student-filters">
            {studentFilterFields.map((field) => <label className="master-field" key={field.key}><span>{field.label}</span><select value={filters[field.key]} onChange={(event) => updateFilter(field.key, event.target.value)}>{field.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}
          </div>
          <label className="master-search"><SearchInput aria-label="Cari NIS, NISN, atau nama siswa" onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1) }} placeholder="Cari NIS / Nama siswa..." value={searchQuery} /><Icon name="search" /></label>
        </div>

        <div className="master-data-actions">
          <div>{selectedRows.size > 0 && <span className="master-selection-count">{selectedRows.size} data dipilih</span>}</div>
          <div>
            <Button className="master-button secondary" onClick={() => setModal({ type: 'import' })}><Icon name="download" />Import Siswa</Button>
            <Button className="master-button secondary" onClick={() => onNotify('Data siswa siap diekspor. Fitur Excel akan diintegrasikan pada tahap berikutnya.')}><Icon name="document" />Export Excel</Button>
            <Button className="master-button primary" onClick={() => setModal({ type: 'add' })}><Icon name="plus" />Tambah Siswa</Button>
          </div>
        </div>

        {selectedRows.size > 0 && <div className="master-bulk-toolbar"><strong>{selectedRows.size} siswa dipilih</strong><span><button onClick={changeBulkStatus} type="button">Ubah Status</button><button onClick={() => onNotify(`${selectedRows.size} siswa siap diekspor.`)} type="button">Export</button><button onClick={() => setSelectedRows(new Set())} type="button">Batal Pilih</button></span></div>}

        <div className="master-table-heading"><h3>Daftar Siswa</h3></div>
        <div className="master-table-scroll">
          <table className="master-student-table">
            <thead><tr><th><input aria-label="Pilih semua siswa pada halaman ini" checked={allVisibleSelected} onChange={toggleVisible} type="checkbox" /></th><th>No</th><th>NIS</th><th>NISN</th><th>Nama Siswa</th><th>Kelas</th><th>Jenis Kelamin</th><th>Tempat, Tanggal Lahir</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{visibleStudents.length === 0 ? <tr><td className="master-empty-row" colSpan="10"><Icon name="search" /><strong>Data tidak ditemukan</strong><span>Coba ubah filter atau kata pencarian.</span></td></tr> : visibleStudents.map((student, index) => <tr key={student.id}><td><input aria-label={`Pilih ${student.name}`} checked={selectedRows.has(student.id)} onChange={() => toggleStudent(student.id)} type="checkbox" /></td><td>{startIndex + index + 1}</td><td>{student.nis}</td><td>{student.nisn}</td><td className="master-name-cell">{student.name}</td><td>{student.className}</td><td><span className={`master-gender ${student.genderCode === 'P' ? 'female' : 'male'}`}>{student.genderCode}</span></td><td>{student.birth}</td><td><span className={`master-data-status ${student.status.toLowerCase().replaceAll(' ', '-')}`}>{student.status}</span></td><td><div className="master-row-actions"><button aria-label={`Lihat ${student.name}`} onClick={() => setModal({ type: 'detail', student })} type="button"><Icon name="eye" /></button><button aria-label={`Edit ${student.name}`} onClick={() => setModal({ type: 'edit', student })} type="button"><Icon name="edit" /></button><span><button aria-label={`Aksi lainnya ${student.name}`} onClick={() => setOpenMenuId((current) => current === student.id ? null : student.id)} type="button"><Icon name="more" /></button>{openMenuId === student.id && <span className="master-action-menu"><button onClick={() => setModal({ type: 'detail', student })} type="button">Lihat Detail</button><button onClick={() => setModal({ type: 'edit', student })} type="button">Edit Data</button><button onClick={() => archiveStudent(student)} type="button">Arsipkan</button></span>}</span></div></td></tr>)}</tbody>
          </table>
        </div>
        <MasterPagination currentPage={safePage} itemLabel="siswa" onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={filteredStudents.length} totalPages={totalPages} />
      </section>

      {modal?.type === 'import' && <MasterImportModal entityLabel="Siswa" onClose={() => setModal(null)} onComplete={() => { setModal(null); onNotify('Simulasi import data siswa berhasil.') }} />}
      {['add', 'edit'].includes(modal?.type) && <MasterEntityModal entityLabel="Siswa" fields={studentFormFields} initialData={modal.student} mode={modal.type} onClose={() => setModal(null)} onSave={saveStudent} />}
      {modal?.type === 'detail' && <MasterDetailModal entityLabel="Siswa" name={modal.student.name} onClose={() => setModal(null)} onEdit={() => setModal({ type: 'edit', student: modal.student })} sections={createDetailSections(modal.student)} />}
    </>
  )
}

export default MasterStudentView
