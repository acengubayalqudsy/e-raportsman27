import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import Pagination from '../common/Pagination.jsx'
import assessmentService from '../../services/assessmentService.js'
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

function HomeroomContextCard({ context, supplementary }) {
  const className = supplementary?.class?.name || context?.homeroom_class?.class_name || 'Kelas aktif'
  const academicYear = supplementary?.semester?.academic_year?.name || context?.active_academic_year?.name || 'Tahun ajaran aktif'
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
  const noteLabel = isHomeroom ? 'Catatan Wali Kelas' : 'Catatan Kokurikuler'
  const initialClass = isHomeroom ? 'Kelas aktif' : (activityOptions.classes?.[0] || 'Semua Kelas')
  const initialAcademicYear = isHomeroom ? 'Tahun ajaran aktif' : (activityOptions.academicYears?.[0] || 'Semua Tahun')
  const initialSemester = isHomeroom ? 'Semester aktif' : (activityOptions.semesters?.[0] || 'Semua Semester')
  const [notes, setNotes] = useState([])
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
  const [loadError, setLoadError] = useState('')
  const [supplementary, setSupplementary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  const classId = context?.homeroom_class?.class_id || context?.homeroom_class?.id || context?.assigned_courses?.[0]?.class_id
  const semesterId = context?.active_semester?.id

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
    const cId = ctxRes.data.homeroom_class?.id || ctxRes.data.assigned_courses?.[0]?.class_id
    const sId = ctxRes.data.active_semester?.id
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
        academicYear: suppRes.data?.semester?.academic_year?.name || 'Tahun ajaran aktif',
        semester: suppRes.data?.semester?.name || 'Semester aktif',
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
    setIsLoading(false)
    return true
  }, [isHomeroom, noteLabel])

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
    if (res?.success) {
      const refreshed = await loadData()
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

        {loadError ? (
          <NotesErrorState message={loadError} />
        ) : isLoading ? (
          <EmptyState className="activity-notes-empty">
            <strong>Memuat {noteLabel.toLowerCase()}...</strong>
          </EmptyState>
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
