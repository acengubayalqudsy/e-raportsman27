import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  attendanceCategories,
  attendanceDistribution,
  attendanceMonthInfo,
  attendanceOptions,
  attendanceRecapRows,
  attendanceSummary,
} from '../../data/absensi.js'

const DEFAULT_ROWS_PER_PAGE = 8

const fallbackCategories = [
  { label: 'Sangat Baik', description: '(≥ 90%)', tone: 'excellent' },
  { label: 'Baik', description: '(80% - 89%)', tone: 'good' },
  { label: 'Cukup', description: '(70% - 79%)', tone: 'fair' },
  { label: 'Perlu Perhatian', description: '(< 70%)', tone: 'attention' },
]

const statusLegend = [
  { key: 'present', label: 'Hadir', tone: 'present', color: '#0aa56e' },
  { key: 'sick', label: 'Sakit', tone: 'sick', color: '#f7a815' },
  { key: 'permit', label: 'Izin', tone: 'permit', color: '#2c91df' },
  { key: 'absent', label: 'Tanpa Keterangan', shortLabel: 'Tanpa Ket.', tone: 'absent', color: '#f04450' },
]

function getOptionValue(option) {
  if (typeof option === 'string' || typeof option === 'number') return String(option)
  return String(option?.value ?? option?.label ?? option?.name ?? '')
}

function getOptionList(options, keys, fallback) {
  const source = keys.find((key) => Array.isArray(options?.[key]))
  return (source ? options[source] : fallback).map(getOptionValue).filter(Boolean)
}

function getCount(row, key) {
  const aliases = {
    present: ['present', 'hadir'],
    sick: ['sick', 'sakit'],
    permit: ['permit', 'permission', 'izin'],
    absent: ['absent', 'withoutExplanation', 'tanpaKeterangan', 'alpha', 'alpa'],
  }

  const sourceKey = aliases[key].find((field) => row?.[field] !== undefined)
  return Math.max(0, Number(row?.[sourceKey]) || 0)
}

function getTotal(row) {
  const calculated = statusLegend.reduce((total, status) => total + getCount(row, status.key), 0)
  return Math.max(0, Number(row?.total ?? row?.totalDays ?? row?.effectiveDays) || calculated)
}

function getPercentage(row) {
  const providedPercentage = Number(row?.percentage)
  if (Number.isFinite(providedPercentage)) return Math.max(0, providedPercentage)

  const total = getTotal(row)
  return total > 0 ? (getCount(row, 'present') / total) * 100 : 0
}

function getCategory(percentage) {
  if (percentage >= 90) return 'Sangat Baik'
  if (percentage >= 80) return 'Baik'
  if (percentage >= 70) return 'Cukup'
  return 'Perlu Perhatian'
}

function getRowCategory(row) {
  return row?.category ?? getCategory(getPercentage(row))
}

function getCategoryTone(category) {
  return {
    'Sangat Baik': 'excellent',
    Baik: 'good',
    Cukup: 'fair',
    'Perlu Perhatian': 'attention',
  }[category] || 'good'
}

function formatPercentage(value) {
  return `${Number(value || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function normalizeCategory(item, index) {
  const fallback = fallbackCategories[index] || fallbackCategories[0]
  if (typeof item === 'string') {
    return { ...fallback, label: item }
  }

  const label = item?.label ?? item?.name ?? fallback.label
  const suppliedDescription = item?.description ?? item?.range
  return {
    label,
    description: typeof suppliedDescription === 'string' ? suppliedDescription : fallback.description,
    tone: getCategoryTone(label) || fallback.tone,
  }
}

function AttendanceDetailModal({ onClose, row }) {
  const percentage = getPercentage(row)
  const category = getRowCategory(row)
  const dialogRef = useRef(null)

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="attendance-modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <section
        aria-labelledby="attendance-detail-title"
        aria-modal="true"
        className="attendance-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="attendance-modal-header">
          <div>
            <span>Detail Rekap Absensi</span>
            <h3 id="attendance-detail-title">{row.name ?? row.studentName}</h3>
            <p>{row.nis} · {row.className ?? 'X Merdeka 3'}</p>
          </div>
          <button aria-label="Tutup detail absensi" onClick={onClose} type="button">×</button>
        </header>

        <div className="attendance-modal-context">
          <div><span>Tahun Ajaran</span><strong>{row.academicYear ?? '2024/2025'}</strong></div>
          <div><span>Semester</span><strong>{row.semester ?? 'Genap'}</strong></div>
          <div><span>Periode</span><strong>{row.month ?? row.period ?? 'Mei 2025'}</strong></div>
          <div>
            <span>Kategori</span>
            <strong className={`attendance-category-text attendance-category-${getCategoryTone(category)}`}>{category}</strong>
          </div>
        </div>

        <div className="attendance-modal-stat-grid">
          {statusLegend.map((status) => (
            <article className={`attendance-modal-stat attendance-modal-stat-${status.tone}`} key={status.key}>
              <span>{status.label}</span>
              <strong>{getCount(row, status.key)}</strong>
              <small>hari</small>
            </article>
          ))}
        </div>

        <div className="attendance-modal-percentage">
          <div>
            <span>Persentase Kehadiran</span>
            <strong>{formatPercentage(percentage)}</strong>
          </div>
          <div className="attendance-modal-percentage-track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, percentage)}%` }} />
          </div>
          <p>Persentase mengikuti data rekap kehadiran yang tersimpan pada periode aktif.</p>
        </div>

        <footer className="attendance-modal-actions">
          <Button className="attendance-button attendance-button-primary" onClick={onClose}>Tutup</Button>
        </footer>
      </section>
    </div>
  )
}

function AttendanceRecapView({ onNotify = () => {}, onSummaryChange }) {
  const classOptions = useMemo(
    () => getOptionList(attendanceOptions, ['classes', 'classNames'], ['X Merdeka 3']),
    [],
  )
  const academicYearOptions = useMemo(
    () => getOptionList(attendanceOptions, ['academicYears', 'years'], ['2024/2025']),
    [],
  )
  const semesterOptions = useMemo(
    () => getOptionList(attendanceOptions, ['semesters'], ['Genap']),
    [],
  )
  const monthOptions = useMemo(
    () => getOptionList(attendanceOptions, ['months', 'periods'], ['Mei 2025']),
    [],
  )
  const initialFilters = useMemo(() => ({
    className: classOptions.includes('X Merdeka 3') ? 'X Merdeka 3' : (classOptions[0] ?? 'X Merdeka 3'),
    academicYear: academicYearOptions.includes('2024/2025') ? '2024/2025' : (academicYearOptions[0] ?? '2024/2025'),
    semester: semesterOptions.includes('Genap') ? 'Genap' : semesterOptions[0],
    month: monthOptions.includes('Mei 2025') ? 'Mei 2025' : monthOptions[0],
  }), [academicYearOptions, classOptions, monthOptions, semesterOptions])

  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [detailRow, setDetailRow] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const refreshTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(refreshTimerRef.current), [])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return attendanceRecapRows.filter((row) => {
      const matchesSearch = !query || [row.nis, row.name, row.studentName]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
      const matchesClass = !row.className || row.className === filters.className
      const matchesYear = !row.academicYear || row.academicYear === filters.academicYear
      const matchesSemester = !row.semester || row.semester === filters.semester
      const rowMonth = row.month ?? row.period
      const matchesMonth = !rowMonth || rowMonth === filters.month
      return matchesSearch && matchesClass && matchesYear && matchesSemester && matchesMonth
    })
  }, [filters, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleRows = filteredRows.slice(startIndex, startIndex + rowsPerPage)

  const aggregate = useMemo(() => {
    const calculatedStatusTotals = statusLegend.reduce((result, status) => ({
      ...result,
      [status.key]: filteredRows.reduce((sum, row) => sum + getCount(row, status.key), 0),
    }), {})
    const calculatedTotal = Object.values(calculatedStatusTotals).reduce((sum, value) => sum + value, 0)
    const calculatedPercentages = statusLegend.reduce((result, status) => ({
      ...result,
      [status.key]: calculatedTotal > 0 ? (calculatedStatusTotals[status.key] / calculatedTotal) * 100 : 0,
    }), {})
    const rowPercentages = filteredRows.map(getPercentage)
    const averageFromRows = rowPercentages.length
      ? rowPercentages.reduce((sum, value) => sum + value, 0) / rowPercentages.length
      : 0
    const isDefaultDataset = !searchQuery.trim()
      && filters.className === initialFilters.className
      && filters.academicYear === initialFilters.academicYear
      && filters.semester === initialFilters.semester
      && filters.month === initialFilters.month
    const suppliedAverage = Number(attendanceMonthInfo?.averageAttendance)
    const statusTotals = isDefaultDataset
      ? statusLegend.reduce((result, status) => {
          const distributionItem = attendanceDistribution.find((item) => (
            item.key === status.key || (status.key === 'permit' && item.key === 'permission')
          ))
          return { ...result, [status.key]: Number(distributionItem?.value) || calculatedStatusTotals[status.key] }
        }, {})
      : calculatedStatusTotals
    const percentages = isDefaultDataset
      ? statusLegend.reduce((result, status) => {
          const distributionItem = attendanceDistribution.find((item) => (
            item.key === status.key || (status.key === 'permit' && item.key === 'permission')
          ))
          return { ...result, [status.key]: Number(distributionItem?.percentage) || calculatedPercentages[status.key] }
        }, {})
      : calculatedPercentages

    return {
      percentages,
      statusTotals,
      overallPercentage: isDefaultDataset && Number.isFinite(suppliedAverage) ? suppliedAverage : averageFromRows,
      highest: rowPercentages.length ? Math.max(...rowPercentages) : 0,
      lowest: rowPercentages.length ? Math.min(...rowPercentages) : 0,
    }
  }, [filteredRows, filters, initialFilters, searchQuery])

  const categoryRows = useMemo(() => {
    const source = Array.isArray(attendanceCategories) && attendanceCategories.length
      ? attendanceCategories.slice(0, 4).map(normalizeCategory)
      : fallbackCategories

    return source.map((category) => {
      const count = filteredRows.filter((row) => getRowCategory(row) === category.label).length
      return {
        ...category,
        count,
        percentage: filteredRows.length > 0 ? (count / filteredRows.length) * 100 : 0,
      }
    })
  }, [filteredRows])

  const contextualSummary = useMemo(() => attendanceSummary.map((item) => {
    if (item.key === 'students') {
      return { ...item, value: String(filteredRows.length), numericValue: filteredRows.length, caption: filters.className }
    }
    if (item.key === 'attendance') {
      return {
        ...item,
        value: formatPercentage(aggregate.overallPercentage),
        numericValue: aggregate.overallPercentage,
      }
    }

    const statusKey = item.key === 'permission' ? 'permit' : item.key
    if (statusKey in aggregate.statusTotals) {
      return {
        ...item,
        value: String(aggregate.statusTotals[statusKey]),
        numericValue: aggregate.statusTotals[statusKey],
        caption: formatPercentage(aggregate.percentages[statusKey]),
      }
    }
    return item
  }), [aggregate, filteredRows.length, filters.className])

  useEffect(() => {
    onSummaryChange?.(contextualSummary)
  }, [contextualSummary, onSummaryChange])

  const donutStyle = useMemo(() => {
    const distributionTotal = Object.values(aggregate.statusTotals).reduce((sum, value) => sum + value, 0)
    if (distributionTotal === 0) return { '--attendance-donut': '#e8edf3' }

    const presentEnd = aggregate.percentages.present
    const sickEnd = presentEnd + aggregate.percentages.sick
    const permitEnd = sickEnd + aggregate.percentages.permit
    return {
      '--attendance-donut': `conic-gradient(
        ${statusLegend[0].color} 0 ${presentEnd}%,
        ${statusLegend[1].color} ${presentEnd}% ${sickEnd}%,
        ${statusLegend[2].color} ${sickEnd}% ${permitEnd}%,
        ${statusLegend[3].color} ${permitEnd}% 100%
      )`,
    }
  }, [aggregate.percentages, aggregate.statusTotals])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
    setSelectedIds(new Set())
  }

  const toggleRow = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))

  const toggleVisibleRows = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) visibleRows.forEach((row) => next.delete(row.id))
      else visibleRows.forEach((row) => next.add(row.id))
      return next
    })
  }

  const refreshData = () => {
    clearTimeout(refreshTimerRef.current)
    setIsLoading(true)
    refreshTimerRef.current = setTimeout(() => {
      setFilters(initialFilters)
      setSearchQuery('')
      setCurrentPage(1)
      setSelectedIds(new Set())
      setIsLoading(false)
      onNotify('Data absensi berhasil diperbarui ke kondisi awal.')
    }, 650)
  }

  const filterFields = [
    { key: 'className', label: 'Kelas', options: classOptions },
    { key: 'academicYear', label: 'Tahun Ajaran', options: academicYearOptions },
    { key: 'semester', label: 'Semester', options: semesterOptions },
    { key: 'month', label: 'Bulan', options: monthOptions, icon: 'calendar' },
  ]

  const schoolDays = attendanceMonthInfo?.schoolDays ?? attendanceMonthInfo?.effectiveDays ?? 23
  const suppliedHighest = Number(attendanceMonthInfo?.highestAttendance)
  const suppliedLowest = Number(attendanceMonthInfo?.lowestAttendance)
  const isDefaultContext = !searchQuery.trim()
    && filters.className === initialFilters.className
    && filters.academicYear === initialFilters.academicYear
    && filters.semester === initialFilters.semester
    && filters.month === initialFilters.month
  const monthInfoRows = [
    { label: 'Hari Sekolah', value: `${schoolDays} hari`, icon: 'calendar' },
    { label: 'Rata-rata Kehadiran', value: formatPercentage(aggregate.overallPercentage), icon: 'clock' },
    {
      label: 'Kehadiran Tertinggi',
      value: formatPercentage(isDefaultContext && Number.isFinite(suppliedHighest) ? suppliedHighest : aggregate.highest),
      icon: 'arrowUp',
    },
    {
      label: 'Kehadiran Terendah',
      value: formatPercentage(isDefaultContext && Number.isFinite(suppliedLowest) ? suppliedLowest : aggregate.lowest),
      icon: 'trend',
    },
  ]

  return (
    <>
      <section className="attendance-filter-card">
        <div className="attendance-filter-toolbar">
          <div className="attendance-filter-grid">
            {filterFields.map((field) => (
              <label className="attendance-field" key={field.key}>
                <span>{field.label}</span>
                <div className="attendance-select-wrap">
                  {field.icon && <Icon name={field.icon} />}
                  <select
                    aria-label={`Filter ${field.label}`}
                    onChange={(event) => updateFilter(field.key, event.target.value)}
                    value={filters[field.key]}
                  >
                    {field.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </label>
            ))}
          </div>

          <label className="attendance-search">
            <span className="attendance-sr-only">Cari siswa berdasarkan NIS atau nama</span>
            <SearchInput
              aria-label="Cari siswa berdasarkan NIS atau nama"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
                setSelectedIds(new Set())
              }}
              placeholder="Cari siswa (NIS/Nama)..."
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="attendance-filter-actions">
          <div className="attendance-selection-note">
            {selectedIds.size > 0 && <span>{selectedIds.size} siswa dipilih</span>}
          </div>
          <div className="attendance-action-group">
            <Button
              className="attendance-button attendance-button-secondary"
              onClick={() => onNotify('Filter lanjutan akan tersedia pada tahap integrasi berikutnya.')}
            >
              <Icon name="filter" />Filter Lanjutan
            </Button>
            <Button
              className="attendance-button attendance-button-secondary"
              onClick={() => onNotify('Fitur export absensi akan diintegrasikan pada tahap berikutnya.')}
            >
              <Icon name="download" />Export Excel
            </Button>
            <Button
              className="attendance-button attendance-button-primary"
              disabled={isLoading}
              onClick={refreshData}
            >
              <Icon className={isLoading ? 'attendance-spin' : ''} name="reset" />
              {isLoading ? 'Memuat...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </section>

      <div className="attendance-recap-layout">
        <section className={`attendance-table-card${isLoading ? ' attendance-is-loading' : ''}`}>
          <header className="attendance-table-header">
            <div>
              <h2>Rekap Absensi Siswa - {filters.month}</h2>
              <p>{filteredRows.length} siswa sesuai konteks yang dipilih</p>
            </div>
            <div className="attendance-inline-legend" aria-label="Legenda status kehadiran">
              {statusLegend.map((status) => (
                <span key={status.key}><i className={`attendance-dot attendance-dot-${status.tone}`} />{status.shortLabel ?? status.label}</span>
              ))}
            </div>
          </header>

          <div className="attendance-table-scroll">
            <table className="attendance-table attendance-recap-table">
              <thead>
                <tr>
                  <th rowSpan="2">
                    <input
                      aria-label="Pilih semua siswa pada halaman ini"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleRows}
                      type="checkbox"
                    />
                  </th>
                  <th rowSpan="2">No</th>
                  <th rowSpan="2">NIS</th>
                  <th rowSpan="2">Nama Siswa</th>
                  <th colSpan="4">Kehadiran (Hari)</th>
                  <th rowSpan="2">Total</th>
                  <th rowSpan="2">Persentase</th>
                  <th rowSpan="2">Kategori</th>
                  <th rowSpan="2">Aksi</th>
                </tr>
                <tr>
                  <th>Hadir</th>
                  <th>Sakit</th>
                  <th>Izin</th>
                  <th>Tanpa Ket.</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td className="attendance-empty-cell" colSpan="12">
                      <EmptyState className="attendance-empty-state">
                        <Icon name="calendar" />
                        <strong>Data absensi tidak ditemukan</strong>
                        <span>Coba ubah kelas, semester, periode, atau kata pencarian.</span>
                      </EmptyState>
                    </td>
                  </tr>
                ) : visibleRows.map((row, index) => {
                  const percentage = getPercentage(row)
                  const category = getRowCategory(row)
                  return (
                    <tr className={selectedIds.has(row.id) ? 'attendance-row-selected' : ''} key={row.id}>
                      <td>
                        <input
                          aria-label={`Pilih ${row.name ?? row.studentName}`}
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          type="checkbox"
                        />
                      </td>
                      <td>{startIndex + index + 1}</td>
                      <td>{row.nis}</td>
                      <td className="attendance-student-name">{row.name ?? row.studentName}</td>
                      <td className="attendance-count-present">{getCount(row, 'present')}</td>
                      <td className="attendance-count-sick">{getCount(row, 'sick')}</td>
                      <td className="attendance-count-permit">{getCount(row, 'permit')}</td>
                      <td className="attendance-count-absent">{getCount(row, 'absent')}</td>
                      <td>{getTotal(row)}</td>
                      <td className="attendance-percentage-cell">{formatPercentage(percentage)}</td>
                      <td>
                        <span className={`attendance-category-badge attendance-category-${getCategoryTone(category)}`}>{category}</span>
                      </td>
                      <td>
                        <div className="attendance-row-actions">
                          <button aria-label={`Lihat detail ${row.name ?? row.studentName}`} onClick={() => setDetailRow(row)} type="button">
                            <Icon name="eye" />
                          </button>
                          <button
                            aria-label={`Opsi lainnya untuk ${row.name ?? row.studentName}`}
                            onClick={() => onNotify(`Opsi lanjutan ${row.name ?? row.studentName} akan tersedia pada tahap berikutnya.`)}
                            type="button"
                          >
                            <Icon name="more" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <MasterPagination
            currentPage={safePage}
            itemLabel="siswa"
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setCurrentPage(1)
              setSelectedIds(new Set())
            }}
            rowsPerPage={rowsPerPage}
            totalItems={filteredRows.length}
            totalPages={totalPages}
          />
        </section>

        <aside className="attendance-side-panels">
          <section className="attendance-side-card attendance-overview-card">
            <h3>Ringkasan Kehadiran</h3>
            <div className="attendance-overview-content">
              <div className="attendance-donut" style={donutStyle}>
                <div>
                  <strong>{formatPercentage(aggregate.overallPercentage)}</strong>
                  <span>Kehadiran</span>
                </div>
              </div>
              <div className="attendance-donut-legend">
                {statusLegend.map((status) => (
                  <div key={status.key}>
                    <i className={`attendance-legend-square attendance-legend-${status.tone}`} />
                    <span>{status.label}</span>
                    <strong>{formatPercentage(aggregate.percentages[status.key])}</strong>
                    <small>{aggregate.statusTotals[status.key]} hari</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="attendance-side-card attendance-category-card">
            <h3>Kategori Kehadiran</h3>
            <div className="attendance-category-list">
              {categoryRows.map((category) => (
                <article key={category.label}>
                  <span className={`attendance-category-icon attendance-category-${category.tone}`}>
                    <Icon name="clipboardCheck" />
                  </span>
                  <div className="attendance-category-copy">
                    <strong>{category.label} <small>{category.description}</small></strong>
                    <span>{category.count} siswa</span>
                  </div>
                  <div className="attendance-category-progress">
                    <span><i className={`attendance-progress-${category.tone}`} style={{ width: `${category.percentage}%` }} /></span>
                    <strong>{formatPercentage(category.percentage)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="attendance-side-card attendance-month-card">
            <h3>Informasi Bulan Ini</h3>
            <div className="attendance-month-list">
              {monthInfoRows.map((item) => (
                <div key={item.label}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="attendance-note">
        <span className="attendance-note-icon"><Icon name="info" /></span>
        <div>
          <strong>Catatan</strong>
          <p>Data absensi akan digunakan sebagai salah satu informasi ketidakhadiran siswa pada rapor.</p>
        </div>
      </section>

      {detailRow && <AttendanceDetailModal onClose={() => setDetailRow(null)} row={detailRow} />}
    </>
  )
}

export default AttendanceRecapView
