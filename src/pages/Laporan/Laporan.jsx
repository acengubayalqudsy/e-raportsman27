import { useLayoutEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import ReportDataView from '../../components/laporan/ReportDataView.jsx'
import ReportLandingView from '../../components/laporan/ReportLandingView.jsx'
import ReportPreviewModal from '../../components/laporan/ReportPreviewModal.jsx'
import {
  recentReports,
  reportCards,
  reportOptions,
  reportStatistics,
  reportSummary,
  reportTabs,
} from '../../data/laporan.js'
import './Laporan.css'

const defaultFilters = {
  academicYear: '2024/2025',
  semester: 'Genap',
  className: 'Semua Kelas',
  grade: 'Semua Tingkat',
  reportType: 'Semua Laporan',
  subject: 'Semua Mata Pelajaran',
  teacher: 'Semua Guru',
  month: 'Mei 2025',
  extracurricular: 'Semua Ekstrakurikuler',
  search: '',
}

function FilterField({ label, value, values, onChange }) {
  return (
    <label className="reporting-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  )
}

function Laporan() {
  const location = useLocation()
  const [filters, setFilters] = useState(defaultFilters)
  const [preview, setPreview] = useState(null)
  const [notice, setNotice] = useState('')
  const activeTab = reportTabs.find((tab) => tab.route === location.pathname)
  const isLanding = !activeTab

  useLayoutEffect(() => {
    const contentWrapper = document.querySelector('.app-content-wrapper')
    contentWrapper?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const visibleCards = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return reportCards.filter((card) => {
      if (filters.reportType !== 'Semua Laporan' && filters.reportType !== card.label) return false
      if (!search) return true
      return [card.label, card.description, ...card.features].join(' ').toLowerCase().includes(search)
    })
  }, [filters.reportType, filters.search])

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const notify = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }
  const breadcrumbTail = activeTab?.label ?? 'Daftar Laporan'
  const filterPanel = (
    <section className="reporting-filter-card">
      <div className="reporting-filter-grid">
        <FilterField label="Tahun Ajaran" onChange={(value) => updateFilter('academicYear', value)} value={filters.academicYear} values={reportOptions.academicYears} />
        <FilterField label="Semester" onChange={(value) => updateFilter('semester', value)} value={filters.semester} values={reportOptions.semesters} />
        <FilterField label="Kelas" onChange={(value) => updateFilter('className', value)} value={filters.className} values={reportOptions.classes} />
        <FilterField label="Tingkat" onChange={(value) => updateFilter('grade', value)} value={filters.grade} values={reportOptions.grades} />
        <FilterField label="Jenis Laporan" onChange={(value) => updateFilter('reportType', value)} value={filters.reportType} values={['Semua Laporan', ...reportTabs.map((item) => item.label)]} />
        <label className="reporting-search"><Icon name="search" /><input onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cari laporan..." type="search" value={filters.search} /></label>
      </div>
    </section>
  )

  return (
    <section className="reporting-page">
      <header className="reporting-header">
        <div><h2>Laporan</h2><p>Pusat laporan akademik sekolah yang dapat ditinjau dan dicetak sesuai kebutuhan</p></div>
        <div className="reporting-breadcrumb"><Breadcrumb items={['Dashboard', 'Laporan', breadcrumbTail]} /></div>
      </header>

      {isLanding ? (
        <ReportLandingView cards={visibleCards} filterPanel={filterPanel} onPreview={setPreview} recentReports={recentReports} statistics={reportStatistics} summary={reportSummary} />
      ) : (
        <ReportDataView activeKey={activeTab.key} filters={filters} key={activeTab.key} onFiltersChange={setFilters} onNotify={notify} onPreview={setPreview} />
      )}

      <ReportPreviewModal onClose={() => setPreview(null)} onNotify={notify} report={preview} />
      {notice && <div aria-live="polite" className="reporting-toast" role="status"><Icon name="checkCircle" /><span>{notice}</span><button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button></div>}
    </section>
  )
}

export default Laporan
