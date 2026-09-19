import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { raporOptions, raporStudents } from '../../data/rapor.js'
import RaporPagination from './RaporPagination.jsx'
import RaporSummary from './RaporSummary.jsx'

const initialFilters = {
  className: raporOptions.classes[0],
  academicYear: raporOptions.academicYears[0],
  semester: raporOptions.semesters[0],
  status: raporOptions.statuses[0],
}

const filterFields = [
  { key: 'className', label: 'Kelas', options: raporOptions.classes },
  { key: 'academicYear', label: 'Tahun Ajaran', options: raporOptions.academicYears },
  { key: 'semester', label: 'Semester', options: raporOptions.semesters },
  { key: 'status', label: 'Status Rapor', options: raporOptions.statuses },
]

const statusLegend = [
  ['Belum Dibuat', 'Rapor belum dibuat untuk siswa ini'],
  ['Sudah Dibuat', 'Rapor sudah dibuat dan siap dilihat'],
  ['Sudah Dibagikan', 'Rapor sudah dibagikan ke siswa/orang tua'],
  ['Revisi', 'Rapor perlu diperbarui atau direvisi'],
]

function statusSlug(status) {
  return status.toLowerCase().replaceAll(' ', '-')
}

function buildSummary(records, selectedClass) {
  const created = records.filter((student) => student.status !== 'Belum Dibuat').length
  const ready = records.filter((student) => ['Siap Dicetak', 'Sudah Dibagikan'].includes(student.status)).length
  const undistributed = records.filter((student) => student.status !== 'Sudah Dibagikan').length
  const lastCreated = records.find((student) => student.createdAt !== '-')

  return [
    { title: 'Total Siswa', value: String(records.length), caption: selectedClass, icon: 'document', tone: 'green', captionIcon: 'users' },
    { title: 'Rapor Sudah Dibuat', value: String(created), caption: `${Math.round((created / Math.max(records.length, 1)) * 100)}% dari total siswa`, icon: 'users', tone: 'blue', captionIcon: 'trend' },
    { title: 'Belum Dibagikan', value: String(undistributed), caption: `${Math.round((undistributed / Math.max(records.length, 1)) * 100)}% rapor`, icon: 'clock', tone: 'orange', captionIcon: 'users' },
    { title: 'Siap Dicetak', value: String(ready), caption: ready ? `${ready} rapor siap` : 'Belum ada rapor', icon: 'download', tone: 'purple', captionIcon: 'download' },
    { title: 'Rapor Terakhir', value: lastCreated?.createdAt ?? '-', caption: lastCreated ? 'Dibuat Administrator' : 'Belum dibuat', icon: 'info', tone: 'teal', captionIcon: 'info' },
  ]
}

function DaftarRaporView({ onNotify }) {
  const [records, setRecords] = useState(() => raporStudents.map((student) => ({ ...student })))
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const contextRecords = useMemo(() => {
    return records.filter((student) => student.className === filters.className && student.academicYear === filters.academicYear && student.semester === filters.semester)
  }, [filters.academicYear, filters.className, filters.semester, records])

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return contextRecords.filter((student) => {
      const matchesSearch = !query || student.nis.toLowerCase().includes(query) || student.name.toLowerCase().includes(query)
      const matchesStatus = filters.status === 'Semua Status' || student.status === filters.status
      return matchesSearch && matchesStatus
    })
  }, [contextRecords, filters.status, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage)
  const summaryItems = useMemo(() => buildSummary(contextRecords, filters.className), [contextRecords, filters.className])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  const updateStatus = (student, status) => {
    setRecords((current) => current.map((item) => item.id === student.id ? {
      ...item,
      status,
      createdAt: status === 'Belum Dibuat' ? '-' : '9 Mei 2025',
      createdBy: status === 'Belum Dibuat' ? '-' : 'Administrator',
    } : item))
    setOpenMenuId(null)
    onNotify(`Status rapor ${student.name} diubah menjadi ${status}.`)
  }

  const generateAll = () => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setRecords((current) => current.map((student) => {
        const inContext = student.className === filters.className && student.academicYear === filters.academicYear && student.semester === filters.semester
        return inContext ? {
          ...student,
          status: student.status === 'Belum Dibuat' ? 'Sudah Dibuat' : student.status,
          createdAt: student.createdAt === '-' ? '9 Mei 2025' : student.createdAt,
          createdBy: student.createdBy === '-' ? 'Administrator' : student.createdBy,
        } : student
      }))
      setIsGenerating(false)
      setShowConfirmation(false)
      onNotify('Rapor siswa berhasil dibuat.')
    }, 650)
  }

  const refreshData = () => {
    setRecords(raporStudents.map((student) => ({ ...student })))
    setFilters(initialFilters)
    setSearchQuery('')
    setCurrentPage(1)
    onNotify('Data rapor berhasil diperbarui.')
  }

  return (
    <>
      <RaporSummary items={summaryItems} />

      <section className="report-list-workspace">
        <div className="report-list-toolbar">
          <div className="report-filter-grid">
            {filterFields.map((field) => (
              <label className="report-field" key={field.key}>
                <span>{field.label}</span>
                <select value={filters[field.key]} onChange={(event) => updateFilter(field.key, event.target.value)}>
                  {field.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>
          <label className="report-search">
            <SearchInput aria-label="Cari siswa berdasarkan NIS atau nama" onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1) }} placeholder="Cari siswa (NIS/Nama)..." value={searchQuery} />
            <Icon name="search" />
          </label>
        </div>

        <div className="report-list-actions">
          <p><Icon name="info" />Rapor akan mengambil data dari Penilaian, Sikap, Absensi, Kegiatan Siswa, dan Catatan Wali Kelas.</p>
          <div>
            <Button className="report-button secondary" onClick={() => setShowConfirmation(true)}><Icon name="settings" />Generate Semua Rapor</Button>
            <Button className="report-button primary" onClick={refreshData}><Icon name="reset" />Refresh Data</Button>
          </div>
        </div>

        <div className="report-table-heading"><h3>Daftar Rapor Siswa</h3></div>
        <div className="report-table-scroll">
          <table className="report-list-table">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Tanggal Lahir</th><th>Status Rapor</th><th>Tanggal Dibuat</th><th>Dibuat Oleh</th><th>Aksi</th></tr></thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr><td className="report-empty-row" colSpan="8"><Icon name="search" /><strong>Tidak ada siswa yang sesuai dengan pencarian.</strong><span>Ubah filter atau gunakan kata kunci yang berbeda.</span></td></tr>
              ) : visibleRecords.map((student, index) => (
                <tr key={student.id}>
                  <td>{startIndex + index + 1}</td><td>{student.nis}</td><td className="report-student-name">{student.name}</td><td>{student.birth}</td>
                  <td><span className={`report-status ${statusSlug(student.status)}`}>{student.status}</span></td><td>{student.createdAt}</td><td>{student.createdBy}</td>
                  <td>
                    <div className="report-row-actions">
                      <button onClick={() => onNotify(`Preview rapor ${student.name} ditampilkan pada halaman Rapor Per Siswa.`)} type="button"><Icon name="eye" />Preview</button>
                      <button disabled={student.status === 'Belum Dibuat'} onClick={() => onNotify('Fitur download PDF akan diintegrasikan pada tahap berikutnya.')} type="button"><Icon name="download" />Download</button>
                      <span className="report-more-wrap">
                        <button aria-label={`Aksi lainnya untuk ${student.name}`} className="icon-only" onClick={() => setOpenMenuId((current) => current === student.id ? null : student.id)} type="button"><Icon name="more" /></button>
                        {openMenuId === student.id && (
                          <span className="report-action-menu">
                            <button onClick={() => onNotify(`Membuka rapor ${student.name}.`)} type="button">Lihat Rapor</button>
                            <button onClick={() => updateStatus(student, 'Sudah Dibuat')} type="button">Generate Ulang</button>
                            <button onClick={() => updateStatus(student, 'Revisi')} type="button">Tandai Perlu Revisi</button>
                            <button onClick={() => updateStatus(student, 'Siap Dicetak')} type="button">Tandai Siap Dicetak</button>
                            <button onClick={() => updateStatus(student, 'Sudah Dibagikan')} type="button">Tandai Sudah Dibagikan</button>
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

        <RaporPagination currentPage={safePage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={filteredRecords.length} totalPages={totalPages} />
      </section>

      <div className="report-support-grid">
        <section className="report-support-card">
          <h3>Keterangan Status Rapor</h3>
          <div className="report-legend-grid">
            {statusLegend.map(([status, description]) => <div key={status}><span className={`report-status ${statusSlug(status)}`}>{status}</span><p>{description}</p></div>)}
          </div>
        </section>
        <section className="report-support-card">
          <h3>Aksi Cepat</h3>
          <div className="report-quick-grid">
            <Link to="/rapor-leger/generate-rapor"><Icon name="settings" /><span><strong>Generate Semua Rapor</strong><small>Buat rapor untuk semua siswa</small></span></Link>
            <Link to="/rapor-leger/rapor-per-siswa"><Icon name="eye" /><span><strong>Preview Acak</strong><small>Lihat contoh rapor siswa</small></span></Link>
            <Link to="/rapor-leger/leger-nilai"><Icon name="table" /><span><strong>Leger Nilai Kelas</strong><small>Lihat rekap nilai kelas</small></span></Link>
            <Link to="/rapor-leger/cetak-export"><Icon name="document" /><span><strong>Export Leger PDF</strong><small>Persiapkan dokumen</small></span></Link>
          </div>
        </section>
      </div>

      {showConfirmation && (
        <div className="report-modal-backdrop" role="presentation">
          <section aria-labelledby="generate-all-title" aria-modal="true" className="report-modal" role="dialog">
            <span className="report-modal-icon"><Icon name="settings" /></span>
            <h3 id="generate-all-title">Generate Semua Rapor?</h3>
            <p>Generate rapor untuk {contextRecords.length} siswa kelas {filters.className}? Proses ini hanya memperbarui data simulasi frontend.</p>
            <div className="report-modal-actions">
              <Button className="report-button secondary" disabled={isGenerating} onClick={() => setShowConfirmation(false)}>Batal</Button>
              <Button className="report-button primary" disabled={isGenerating} onClick={generateAll}>{isGenerating ? <span className="report-spinner" /> : <Icon name="settings" />}{isGenerating ? 'Memproses...' : 'Generate Rapor'}</Button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default DaftarRaporView
