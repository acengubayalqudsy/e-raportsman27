import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import Pagination from '../common/Pagination.jsx'
import assessmentService from '../../services/assessmentService.js'
import { activityOptions, homeroomContext, homeroomNotes } from '../../data/kegiatanSiswa.js'

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

function createNoteRows(rows) {
  return rows.map((row) => ({
    ...row,
    name: getStudentName(row),
    note: getNote(row),
    status: getRowStatus(row),
    isDirty: false,
  }))
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

  return (
    <div className="activity-note-state">
      <span className={`activity-note-status ${status === 'Terisi' ? 'is-filled' : 'is-empty'}`}>{status}</span>
      <small className={row.isDirty ? 'is-dirty' : 'is-saved'}>
        <i aria-hidden="true" />
        {row.isDirty ? 'Ada perubahan' : 'Tersimpan'}
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

function NotesFilters({ filters, onFilterChange, onSearchChange, isHomeroom }) {
  return (
    <div className="activity-notes-filters">
      {!isHomeroom && (
        <>
          <SelectField
            label="Kelas"
            onChange={(value) => onFilterChange('className', value)}
            options={['Semua Kelas', ...(activityOptions.classes || [])]}
            value={filters.className}
          />
          <SelectField
            label="Tahun Ajaran"
            onChange={(value) => onFilterChange('academicYear', value)}
            options={['Semua Tahun', ...(activityOptions.academicYears || [])]}
            value={filters.academicYear}
          />
          <SelectField
            label="Semester"
            onChange={(value) => onFilterChange('semester', value)}
            options={['Semua Semester', ...(activityOptions.semesters || [])]}
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

function HomeroomContextCard() {
  return (
    <section className="activity-homeroom-context" aria-label="Konteks catatan wali kelas">
      <div>
        <span>Kelas</span>
        <strong>{homeroomContext.className}</strong>
      </div>
      <div>
        <span>Wali Kelas</span>
        <strong>{homeroomContext.homeroomTeacherFullName || homeroomContext.homeroomTeacher}</strong>
      </div>
      <div>
        <span>Tahun Ajaran</span>
        <strong>{homeroomContext.academicYear}</strong>
      </div>
      <div>
        <span>Semester</span>
        <strong>{homeroomContext.semester}</strong>
      </div>
      <div>
        <span>Siswa</span>
        <strong>{homeroomContext.studentCount} siswa</strong>
      </div>
    </section>
  )
}

function NotesTable({ rows, firstItem, noteLabel, onNoteChange, onSaveRow, showClass }) {
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
                <textarea
                  aria-label={`${noteLabel} untuk ${getStudentName(row)}`}
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
                  disabled={!row.isDirty}
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

function StudentNotesView({ type, onNotify }) {
  const isHomeroom = type === 'homeroom'
  const rowsSource = homeroomNotes
  const noteLabel = isHomeroom ? 'Catatan Wali Kelas' : 'Catatan Kokurikuler'
  const initialClass = isHomeroom ? homeroomContext.className : (activityOptions.classes?.[0] || 'Semua Kelas')
  const initialAcademicYear = isHomeroom ? homeroomContext.academicYear : (activityOptions.academicYears?.[0] || 'Semua Tahun')
  const initialSemester = isHomeroom ? homeroomContext.semester : (activityOptions.semesters?.[0] || 'Semua Semester')
  const [notes, setNotes] = useState(() => (isHomeroom ? createNoteRows(rowsSource) : []))
  const [filters, setFilters] = useState({
    className: initialClass,
    academicYear: initialAcademicYear,
    semester: initialSemester,
    status: 'Semua Status',
    searchQuery: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)

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

  const [context, setContext] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loadError, setLoadError] = useState('')

  const classId = context?.homeroom_class?.id || context?.assigned_courses?.[0]?.class_id
  const semesterId = context?.active_semester?.id

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      const ctxRes = await assessmentService.getContext()
      if (isMounted && ctxRes.success && ctxRes.data) {
        setContext(ctxRes.data)
        const cId = ctxRes.data.homeroom_class?.id || ctxRes.data.assigned_courses?.[0]?.class_id
        const sId = ctxRes.data.active_semester?.id
        if (cId && sId) {
          const suppRes = await assessmentService.getSupplementaryData(cId, sId)
          if (!suppRes.success) {
            if (!isHomeroom) {
              setNotes([])
              setLoadError(suppRes.error || 'Gagal memuat catatan kokurikuler dari server.')
            }
            return
          }
          if (!isHomeroom) setLoadError('')
          if (isMounted && suppRes.success && suppRes.data?.students?.length) {
            const mapped = suppRes.data.students.flatMap((st) => {
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
                className: suppRes.data.class?.name || homeroomContext.className,
                academicYear: ctxRes.data.active_semester?.academic_year || homeroomContext.academicYear,
                semester: ctxRes.data.active_semester?.name || homeroomContext.semester,
              }

              const records = Array.isArray(st.cocurriculars) ? st.cocurriculars : []
              return records.map((record, index) => ({
                ...base,
                id: `${st.student_id}-${record.id || index}`,
                note: record.description || '',
                title: record.title || '',
                status: record.description ? 'Terisi' : 'Belum Terisi',
                isDirty: false,
              }))
            })
            setNotes(mapped)
          } else if (isMounted && !isHomeroom) {
            setNotes([])
          }
        }
      }
      if (isMounted && !isHomeroom && (!ctxRes.success || !ctxRes.data)) {
        setNotes([])
        setLoadError(ctxRes.error || 'Gagal memuat konteks akademik dari server.')
      }
    }
    loadData().catch((error) => {
      if (isMounted && !isHomeroom) {
        setNotes([])
        setLoadError(error.message || 'Gagal memuat catatan kokurikuler dari server.')
      }
    })
    return () => { isMounted = false }
  }, [isHomeroom, refreshTrigger])

  const saveRow = async (id) => {
    const target = notes.find((row) => row.id === id)
    if (!target?.isDirty || isSaving) return
    if (!target.note.trim()) {
      onNotify?.(`Isi ${noteLabel.toLowerCase()} ${getStudentName(target)} sebelum menyimpan.`)
      return
    }

    setIsSaving(true)
    let res
    if (classId && semesterId) {
      if (isHomeroom) {
        res = await assessmentService.saveHomeroomNotes(classId, semesterId, [
          { student_id: target.id, note: target.note },
        ])
      } else {
        res = await assessmentService.saveCocurriculars(classId, semesterId, [
          { student_id: target.studentId, title: target.title, description: target.note },
        ])
      }
    }
    setIsSaving(false)

    if (!res || res.success) {
      if (isHomeroom) {
        setNotes((current) => current.map((row) => (
          row.id === id ? { ...row, status: getRowStatus(row), isDirty: false } : row
        )))
      } else {
        setRefreshTrigger((current) => current + 1)
      }
      onNotify?.(`${noteLabel} ${getStudentName(target)} berhasil disimpan ke database.`)
    } else {
      onNotify?.(res.error || 'Gagal menyimpan catatan.')
    }
  }

  const saveAll = async () => {
    if (dirtyCount === 0 || isSaving) {
      onNotify?.('Tidak ada perubahan catatan yang perlu disimpan.')
      return
    }

    const emptyDirtyCount = notes.filter((row) => row.isDirty && !row.note.trim()).length
    if (emptyDirtyCount > 0) {
      onNotify?.(`${emptyDirtyCount} catatan masih kosong. Lengkapi sebelum menyimpan semua.`)
      return
    }

    setIsSaving(true)
    let res
    if (classId && semesterId) {
      if (isHomeroom) {
        const payload = notes.filter((r) => r.isDirty).map((r) => ({
          student_id: r.id,
          note: r.note,
        }))
        res = await assessmentService.saveHomeroomNotes(classId, semesterId, payload)
      } else {
        const payload = notes.filter((r) => r.isDirty).map((r) => ({
          student_id: r.studentId,
          title: r.title,
          description: r.note,
        }))
        res = await assessmentService.saveCocurriculars(classId, semesterId, payload)
      }
    }
    setIsSaving(false)

    if (!res || res.success) {
      if (isHomeroom) {
        setNotes((current) => current.map((row) => (
          row.isDirty ? { ...row, status: getRowStatus(row), isDirty: false } : row
        )))
      } else {
        setRefreshTrigger((current) => current + 1)
      }
      onNotify?.(`${dirtyCount} ${noteLabel.toLowerCase()} berhasil disimpan ke database.`)
    } else {
      onNotify?.(res.error || 'Gagal menyimpan catatan.')
    }
  }

  return (
    <section className="activity-notes-view">
      {isHomeroom ? <HomeroomContextCard /> : null}

      <div className="activity-notes-toolbar">
        <NotesFilters
          filters={filters}
          isHomeroom={isHomeroom}
          onFilterChange={updateFilter}
          onSearchChange={(value) => updateFilter('searchQuery', value)}
        />
        <div className="activity-notes-toolbar-actions">
          {dirtyCount > 0 && <span className="activity-unsaved-indicator"><i aria-hidden="true" />{dirtyCount} perubahan belum disimpan</span>}
          <Button className="activity-button primary" onClick={saveAll}>
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
          <span className="activity-notes-total">{filteredNotes.length} siswa</span>
        </div>

        {!isHomeroom && loadError ? (
          <NotesErrorState message={loadError} />
        ) : visibleRows.length > 0 ? (
          <NotesTable
            firstItem={firstItem}
            noteLabel={noteLabel}
            onNoteChange={updateNote}
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

export function CocurricularNotesView({ onNotify }) {
  return <StudentNotesView onNotify={onNotify} type="cocurricular" />
}

export function HomeroomNotesView({ onNotify }) {
  return <StudentNotesView onNotify={onNotify} type="homeroom" />
}
