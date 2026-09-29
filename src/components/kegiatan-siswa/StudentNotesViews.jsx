import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import Pagination from '../common/Pagination.jsx'
import assessmentService from '../../services/assessmentService.js'
import excelService from '../../services/excelService.js'
import { activityOptions } from '../../data/kegiatanSiswa.js'

const DEFAULT_ROWS_PER_PAGE = activityOptions.rowsPerPageOptions?.[0] || 8

function getNote(row) {
  return String(row.note ?? row.catatan ?? row.description ?? '')
}

function getStudentName(row) {
  return row.name || row.studentName || row.student?.name || '-'
}

function getRowStatus(row) {
  return getNote(row).trim() ? 'Terisi' : 'Belum Terisi'
}

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'end', totalPages]
  if (currentPage >= totalPages - 3) return [1, 'start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]

  return [1, 'start', currentPage - 1, currentPage, currentPage + 1, 'end', totalPages]
}

function NotesPagination({ currentPage, rowsPerPage, totalItems, onPageChange, onRowsPerPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const lastItem = Math.min(currentPage * rowsPerPage, totalItems)
  const pageItems = getPageItems(currentPage, totalPages)

  return (
    <Pagination className="activity-pagination">
      <p>Menampilkan {firstItem} - {lastItem} dari {totalItems.toLocaleString('id-ID')} siswa</p>

      <div className="activity-pagination-controls">
        <label className="activity-pagination-size">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))}>
            {(activityOptions.rowsPerPageOptions || [8, 16, 24]).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <button
          aria-label="Halaman sebelumnya"
          disabled={currentPage === 1 || totalItems === 0}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          type="button"
        >
          <Icon name="chevron" />
        </button>

        {pageItems.map((item) => (
          typeof item === 'number' ? (
            <button
              aria-current={currentPage === item ? 'page' : undefined}
              className={currentPage === item ? 'is-active' : ''}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span aria-hidden="true" className="activity-pagination-ellipsis" key={item}>...</span>
          )
        ))}

        <button
          aria-label="Halaman berikutnya"
          className="activity-pagination-next"
          disabled={currentPage >= totalPages || totalItems === 0}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          type="button"
        >
          <Icon name="chevron" />
        </button>
      </div>
    </Pagination>
  )
}

function NoteState({ row }) {
  const status = getRowStatus(row)
  const isNewProject = row.projectId === null && !row.title?.trim() && !row.note.trim()

  return (
    <div className="activity-note-state">
      <span className={`activity-note-status ${status === 'Terisi' ? 'is-filled' : 'is-empty'}`}>{status}</span>
      <small className={row.isDirty ? 'is-dirty' : 'is-saved'}>
        <i aria-hidden="true" />
        {row.isDirty ? 'Ada perubahan' : isNewProject ? 'Belum disimpan' : 'Tersimpan'}
      </small>
    </div>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="activity-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function NotesFilters({ filters, onFilterChange, onSearchChange, isHomeroom, options }) {
  return (
    <div className="activity-notes-filters">
      {!isHomeroom && (
        <>
          <SelectField
            label="Kelas"
            onChange={(value) => onFilterChange('className', value)}
            options={['Semua Kelas', ...options.classes]}
            value={filters.className}
          />
          <SelectField
            label="Tahun Ajaran"
            onChange={(value) => onFilterChange('academicYear', value)}
            options={['Semua Tahun', ...options.academicYears]}
            value={filters.academicYear}
          />
          <SelectField
            label="Semester"
            onChange={(value) => onFilterChange('semester', value)}
            options={['Semua Semester', ...options.semesters]}
            value={filters.semester}
          />
          <SelectField
            label="Status"
            onChange={(value) => onFilterChange('status', value)}
            options={['Semua Status', ...(activityOptions.noteStatuses || ['Terisi', 'Belum Terisi'])]}
            value={filters.status}
          />
        </>
      )}

      <label className="activity-notes-search">
        <span className="activity-sr-only">Cari siswa</span>
        <Icon name="search" />
        <input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari siswa (NIS/Nama)..."
          type="search"
          value={filters.searchQuery}
        />
      </label>
    </div>
  )
}

function HomeroomContextCard({ context, supplementary }) {
  const className = supplementary?.class?.name || context?.homeroom_class?.class_name || 'Kelas aktif'
  const academicYear = supplementary?.semester?.academic_year || context?.active_academic_year?.name || 'Tahun ajaran aktif'
  const semester = supplementary?.semester?.name || context?.active_semester?.name || 'Semester aktif'
  const studentCount = Array.isArray(supplementary?.students) ? supplementary.students.length : 0

  return (
    <section className="activity-homeroom-context" aria-label="Konteks catatan wali kelas">
      <div>
        <span>Kelas</span>
        <strong>{className}</strong>
      </div>
      <div>
        <span>Wali Kelas</span>
        <strong>{context?.homeroom_teacher?.name || context?.homeroom_teacher?.full_name || 'Tidak tersedia'}</strong>
      </div>
      <div>
        <span>Tahun Ajaran</span>
        <strong>{academicYear}</strong>
      </div>
      <div>
        <span>Semester</span>
        <strong>{semester}</strong>
      </div>
      <div>
        <span>Siswa</span>
        <strong>{studentCount} siswa</strong>
      </div>
    </section>
  )
}

function NotesTable({ rows, firstItem, noteLabel, onNoteChange, onTitleChange, onSaveRow, showClass, isSaving }) {
  return (
    <div className="activity-notes-table-wrap">
      <table className="activity-notes-table">
        <thead>
          <tr>
            <th>No</th>
            <th>NIS</th>
            <th>Nama Siswa</th>
            {showClass && <th>Kelas</th>}
            <th>{noteLabel}</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{firstItem + index}</td>
              <td>{row.nis || '-'}</td>
              <td className="activity-notes-student">
                <strong>{getStudentName(row)}</strong>
                {row.studentId && <small>ID siswa: {row.studentId}</small>}
              </td>
              {showClass && <td>{row.className || '-'}</td>}
              <td className="activity-notes-input-cell">
                {showClass && (
                  <input
                    aria-label={`Judul projek untuk ${getStudentName(row)}`}
                    className="activity-notes-title-input"
                    disabled={isSaving}
                    maxLength="150"
                    onChange={(event) => onTitleChange(row.id, event.target.value)}
                    placeholder="Judul projek kokurikuler"
                    value={row.title}
                  />
                )}
                <textarea
                  aria-label={`${noteLabel} untuk ${getStudentName(row)}`}
                  disabled={isSaving}
                  onChange={(event) => onNoteChange(row.id, event.target.value)}
                  placeholder={`Tulis ${noteLabel.toLowerCase()}...`}
                  rows="2"
                  value={row.note}
                />
              </td>
              <td><NoteState row={row} /></td>
              <td>
                <Button
                  className="activity-row-save"
                  disabled={!row.isDirty || isSaving}
                  onClick={() => onSaveRow(row.id)}
                  title={row.isDirty ? 'Simpan catatan' : 'Tidak ada perubahan untuk disimpan'}
                >
                  <Icon name="save" />
                  <span>Simpan</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyNotesState({ label }) {
  return (
    <EmptyState className="activity-notes-empty">
      <Icon name="clipboard" />
      <strong>Data {label.toLowerCase()} tidak ditemukan</strong>
      <span>Coba ubah filter atau kata pencarian.</span>
    </EmptyState>
  )
}

function NotesErrorState({ message }) {
  return (
    <EmptyState className="activity-notes-empty">
      <Icon name="alertCircle" />
      <strong>{message}</strong>
      <span>Periksa koneksi lalu coba lagi.</span>
    </EmptyState>
  )
}

function StudentNotesView({ type, classId: requestedClassId, semesterId: requestedSemesterId, onNotify }) {
  const isHomeroom = type === 'homeroom'
  const noteLabel = isHomeroom ? 'Catatan Wali Kelas' : 'Catatan Kokurikuler'
  const [notes, setNotes] = useState([])
  const [filters, setFilters] = useState({
    className: 'Semua Kelas',
    academicYear: 'Semua Tahun',
    semester: 'Semua Semester',
    status: 'Semua Status',
    searchQuery: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)
  const [newProjectStudentId, setNewProjectStudentId] = useState('')
  const nextDraftId = useRef(0)
  const filterOptions = useMemo(() => ({
    classes: [...new Set(notes.map((row) => row.className).filter(Boolean))],
    academicYears: [...new Set(notes.map((row) => row.academicYear).filter(Boolean))],
    semesters: [...new Set(notes.map((row) => row.semester).filter(Boolean))],
  }), [notes])

  const filteredNotes = useMemo(() => {
    const keyword = filters.searchQuery.trim().toLowerCase()

    return notes.filter((row) => {
      const matchesClass = isHomeroom || filters.className === 'Semua Kelas' || row.className === filters.className
      const matchesAcademicYear = isHomeroom || filters.academicYear === 'Semua Tahun' || row.academicYear === filters.academicYear
      const matchesSemester = isHomeroom || filters.semester === 'Semua Semester' || row.semester === filters.semester
      const matchesStatus = filters.status === 'Semua Status' || getRowStatus(row) === filters.status
      const matchesSearch = !keyword || String(row.nis || '').toLowerCase().includes(keyword) || getStudentName(row).toLowerCase().includes(keyword)

      return matchesClass && matchesAcademicYear && matchesSemester && matchesStatus && matchesSearch
    })
  }, [filters, isHomeroom, notes])

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const firstItem = filteredNotes.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const visibleRows = filteredNotes.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)
  const dirtyCount = notes.filter((row) => row.isDirty).length

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
    setCurrentPage(1)
  }

  const updateNote = (id, note) => {
    setNotes((current) => current.map((row) => (
      row.id === id
        ? { ...row, note, status: getRowStatus({ ...row, note }), isDirty: true }
        : row
    )))
  }

  const updateTitle = (id, title) => {
    setNotes((current) => current.map((row) => (
      row.id === id ? { ...row, title, isDirty: true } : row
    )))
  }

  const [context, setContext] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [supplementary, setSupplementary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  const classId = requestedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const semesterId = requestedSemesterId || context?.active_semester?.id

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return false
    setIsLoading(true)
    setLoadError('')
    const ctxRes = await assessmentService.getContext()
    if (!isMountedRef.current) return false
    if (!ctxRes.success || !ctxRes.data) {
      setNotes([])
      setSupplementary(null)
      setLoadError(ctxRes.error || 'Gagal memuat konteks akademik dari server.')
      setIsLoading(false)
      return false
    }

    setContext(ctxRes.data)
    const cId = requestedClassId || ctxRes.data.homeroom_class?.class_id || ctxRes.data.assigned_courses?.[0]?.class_id
    const sId = requestedSemesterId || ctxRes.data.active_semester?.id
    if (!cId || !sId) {
      setNotes([])
      setSupplementary(null)
      setLoadError('Konteks kelas atau semester aktif tidak tersedia.')
      setIsLoading(false)
      return false
    }

    const suppRes = await assessmentService.getSupplementaryData(cId, sId)
    if (!isMountedRef.current) return false
    if (!suppRes.success) {
      setNotes([])
      setSupplementary(null)
      setLoadError(suppRes.error || `Gagal memuat ${noteLabel.toLowerCase()} dari server.`)
      setIsLoading(false)
      return false
    }

    const students = Array.isArray(suppRes.data?.students) ? suppRes.data.students : []
    setSupplementary(suppRes.data)
    const mapped = students.flatMap((st) => {
      if (isHomeroom) {
        return [{
          id: st.student_id,
          studentId: st.student_id,
          nis: st.nis,
          name: st.name,
          note: st.homeroom_note || '',
          status: st.homeroom_note ? 'Terisi' : 'Belum Terisi',
          isDirty: false,
        }]
      }

      const base = {
        studentId: st.student_id,
        nis: st.nis,
        name: st.name,
        className: suppRes.data?.class?.name || 'Kelas aktif',
        academicYear: suppRes.data?.semester?.academic_year || ctxRes.data.active_academic_year?.name || '',
        semester: suppRes.data?.semester?.name || 'Semester aktif',
      }

      const records = Array.isArray(st.cocurriculars) ? st.cocurriculars : []
      return (records.length ? records : [{ id: null, title: '', description: '' }]).map((record, index) => ({
        ...base,
        id: `${st.student_id}-${record.id || index}`,
        projectId: record.id || null,
        note: record.description || '',
        title: record.title || '',
        status: record.description ? 'Terisi' : 'Belum Terisi',
        isDirty: false,
      }))
    })
    setNotes(mapped)
    setIsLoading(false)
    return true
  }, [isHomeroom, noteLabel, requestedClassId, requestedSemesterId])

  useEffect(() => {
    isMountedRef.current = true
    const load = () => loadData().catch((error) => {
      if (isMountedRef.current) {
        setNotes([])
        setSupplementary(null)
        setLoadError(error.message || `Gagal memuat ${noteLabel.toLowerCase()} dari server.`)
        setIsLoading(false)
      }
    })
    queueMicrotask(load)
    return () => { isMountedRef.current = false }
  }, [loadData, noteLabel])

  const addProject = () => {
    const student = supplementary?.students?.find((item) => String(item.student_id) === newProjectStudentId)
    if (!student) {
      onNotify?.('Pilih siswa untuk menambah projek kokurikuler.')
      return
    }
    const existingBlank = notes.find((row) => row.studentId === student.student_id && !row.projectId && !row.title.trim() && !row.note.trim())
    if (existingBlank) {
      onNotify?.('Isi baris projek kosong untuk siswa ini terlebih dahulu.')
      return
    }
    nextDraftId.current += 1
    setNotes((current) => [{
      id: `draft-${student.student_id}-${nextDraftId.current}`,
      projectId: null,
      studentId: student.student_id,
      nis: student.nis,
      name: student.name,
      className: supplementary?.class?.name || 'Kelas aktif',
      academicYear: supplementary?.semester?.academic_year || context?.active_academic_year?.name || '',
      semester: supplementary?.semester?.name || context?.active_semester?.name || '',
      title: '',
      note: '',
      isDirty: false,
    }, ...current])
    setFilters({ className: 'Semua Kelas', academicYear: 'Semua Tahun', semester: 'Semua Semester', status: 'Semua Status', searchQuery: '' })
    setCurrentPage(1)
  }

  const projectsForStudent = (studentId) => notes
    .filter((row) => row.studentId === studentId && row.title.trim() && row.note.trim())
    .map((row) => ({ ...(row.projectId ? { id: row.projectId } : {}), title: row.title.trim(), description: row.note.trim() }))

  const saveRow = async (id) => {
    const target = notes.find((row) => row.id === id)
    if (!target?.isDirty || isSaving) return
    if (!classId || !semesterId) {
      onNotify?.('Kelas atau semester aktif tidak tersedia.')
      return
    }
    if (!isHomeroom && (!target.title.trim() || !target.note.trim())) {
      onNotify?.(`Isi judul projek dan catatan kokurikuler ${getStudentName(target)} sebelum menyimpan.`)
      return
    }
    if (!isHomeroom && notes.some((row) => row.studentId === target.studentId && row.isDirty && (!row.title.trim() || !row.note.trim()))) {
      onNotify?.(`Lengkapi semua projek yang diubah untuk ${getStudentName(target)} sebelum menyimpan.`)
      return
    }

    setIsSaving(true)
    let res
    if (classId && semesterId) {
      if (isHomeroom) {
        res = await assessmentService.saveHomeroomNotes(classId, semesterId, [
          { student_id: target.studentId, note: target.note },
        ])
      } else {
        res = await assessmentService.saveCocurriculars(classId, semesterId, [
          { student_id: target.studentId, projects: projectsForStudent(target.studentId) },
        ])
      }
    }
    if (res?.success) {
      const hasOtherChanges = notes.some((row) => row.isDirty && row.studentId !== target.studentId)
      const refreshed = hasOtherChanges ? true : await loadData()
      if (hasOtherChanges) {
        setNotes((current) => current.map((row) => row.studentId === target.studentId ? { ...row, isDirty: false } : row))
      }
      setIsSaving(false)
      if (!refreshed) {
        onNotify?.(`${noteLabel} tersimpan, tetapi verifikasi data terbaru gagal. Silakan muat ulang.`)
        return
      }
      onNotify?.(`${noteLabel} ${getStudentName(target)} berhasil disimpan ke database.`)
    } else {
      setIsSaving(false)
      onNotify?.(res.error || 'Gagal menyimpan catatan.')
    }
  }

  const saveAll = async () => {
    if (dirtyCount === 0 || isSaving) {
      onNotify?.('Tidak ada perubahan catatan yang perlu disimpan.')
      return
    }

    if (!classId || !semesterId) {
      onNotify?.('Kelas atau semester aktif tidak tersedia.')
      return
    }
    const emptyDirtyCount = notes.filter((row) => row.isDirty && !isHomeroom && (!row.note.trim() || !row.title.trim())).length
    if (emptyDirtyCount > 0) {
      onNotify?.(`${emptyDirtyCount} catatan masih kosong. Lengkapi sebelum menyimpan semua.`)
      return
    }

    setIsSaving(true)
    let res
    if (classId && semesterId) {
      if (isHomeroom) {
        const payload = notes.filter((r) => r.isDirty).map((r) => ({
          student_id: r.studentId,
          note: r.note,
        }))
        res = await assessmentService.saveHomeroomNotes(classId, semesterId, payload)
      } else {
        const changedStudents = [...new Set(notes.filter((row) => row.isDirty).map((row) => row.studentId))]
        const payload = changedStudents.map((studentId) => ({
          student_id: studentId,
          projects: projectsForStudent(studentId),
        }))
        res = await assessmentService.saveCocurriculars(classId, semesterId, payload)
      }
    }
    if (res?.success) {
      const refreshed = await loadData()
      setIsSaving(false)
      if (!refreshed) {
        onNotify?.(`${noteLabel} tersimpan, tetapi verifikasi data terbaru gagal. Silakan muat ulang.`)
        return
      }
      onNotify?.(`${dirtyCount} ${noteLabel.toLowerCase()} berhasil disimpan ke database.`)
    } else {
      setIsSaving(false)
      onNotify?.(res.error || 'Gagal menyimpan catatan.')
    }
  }

  return (
    <section className="activity-notes-view">
      {isHomeroom ? <HomeroomContextCard context={context} supplementary={supplementary} /> : null}

      <div className="activity-notes-toolbar">
        <NotesFilters
          filters={filters}
          isHomeroom={isHomeroom}
          options={filterOptions}
          onFilterChange={updateFilter}
          onSearchChange={(value) => updateFilter('searchQuery', value)}
        />
        <div className="activity-notes-toolbar-actions">
          <Button className="activity-button activity-button-secondary" disabled={!classId || !semesterId || isLoading} onClick={() => excelService.download(isHomeroom ? 'homeroom_notes' : 'cocurriculars', 'export', { class_id: classId, semester_id: semesterId, search: filters.searchQuery, status: filters.status === 'Semua Status' ? '' : filters.status }).catch((error) => onNotify?.(error.message))} type="button"><Icon name="download" />Export Excel</Button>
          {!isHomeroom && (
            <div className="activity-add-project">
              <select aria-label="Siswa untuk projek baru" onChange={(event) => setNewProjectStudentId(event.target.value)} value={newProjectStudentId}>
                <option value="">Pilih siswa</option>
                {(supplementary?.students || []).map((student) => <option key={student.student_id} value={student.student_id}>{student.nis} - {student.name}</option>)}
              </select>
              <Button className="activity-button activity-button-secondary" disabled={isLoading || !!loadError} onClick={addProject} type="button"><Icon name="plus" />Tambah Projek</Button>
            </div>
          )}
          {dirtyCount > 0 && <span className="activity-unsaved-indicator"><i aria-hidden="true" />{dirtyCount} perubahan belum disimpan</span>}
          <Button className="activity-button primary" disabled={isSaving || dirtyCount === 0} onClick={saveAll}>
            <Icon name="save" />
            Simpan Semua Catatan
          </Button>
        </div>
      </div>

      <section className="activity-notes-card">
        <div className="activity-notes-card-header">
          <div>
            <h2>{noteLabel}</h2>
            <p>{isHomeroom ? 'Catatan perkembangan siswa dari wali kelas untuk semester aktif.' : 'Catat perkembangan siswa pada kegiatan penguatan pembelajaran.'}</p>
          </div>
          <span className="activity-notes-total">{filteredNotes.length} {isHomeroom ? 'siswa' : 'projek'}</span>
        </div>

        {loadError ? (
          <NotesErrorState message={loadError} />
        ) : isLoading ? (
          <EmptyState className="activity-notes-empty">
            <strong>Memuat {noteLabel.toLowerCase()}...</strong>
          </EmptyState>
        ) : visibleRows.length > 0 ? (
          <NotesTable
            firstItem={firstItem}
            isSaving={isSaving}
            noteLabel={noteLabel}
            onNoteChange={updateNote}
            onTitleChange={updateTitle}
            onSaveRow={saveRow}
            rows={visibleRows}
            showClass={!isHomeroom}
          />
        ) : (
          <EmptyNotesState label={noteLabel} />
        )}

        <NotesPagination
          currentPage={safeCurrentPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
          }}
          rowsPerPage={rowsPerPage}
          totalItems={filteredNotes.length}
        />
      </section>
    </section>
  )
}

export function CocurricularNotesView({ classId, semesterId, onNotify }) {
  return <StudentNotesView classId={classId} semesterId={semesterId} onNotify={onNotify} type="cocurricular" />
}

export function HomeroomNotesView({ classId, semesterId, onNotify }) {
  return <StudentNotesView classId={classId} semesterId={semesterId} onNotify={onNotify} type="homeroom" />
}
