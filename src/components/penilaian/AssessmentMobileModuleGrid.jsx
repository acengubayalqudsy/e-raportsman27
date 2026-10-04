import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'

const assessmentMobileTabs = [
  {
    key: 'input-nilai',
    label: 'Input Nilai',
    icon: 'grade',
    route: '/penilaian/input-nilai',
    bg: '#E0F2FE',
    color: '#0284C7',
  },
  {
    key: 'nilai-per-mapel',
    label: 'Nilai Per Mapel',
    icon: 'table',
    route: '/penilaian/nilai-per-mapel',
    bg: '#EDE9FE',
    color: '#7C3AED',
  },
  {
    key: 'nilai-sikap',
    label: 'Nilai Sikap',
    icon: 'shield',
    route: '/penilaian/nilai-sikap',
    bg: '#FEF3C7',
    color: '#D97706',
  },
  {
    key: 'capaian-kompetensi',
    label: 'Capaian Kompetensi',
    icon: 'sliders',
    route: '/penilaian/capaian-kompetensi',
    bg: '#FCE7F3',
    color: '#DB2777',
  },
  {
    key: 'rekap-nilai-per-kelas',
    label: 'Rekap Nilai per Kelas',
    icon: 'table',
    route: '/penilaian/rekap-nilai-per-kelas',
    bg: '#D1FAE5',
    color: '#059669',
  },
  {
    key: 'validasi-nilai',
    label: 'Validasi Nilai',
    icon: 'checkCircle',
    route: '/penilaian/validasi-nilai',
    bg: '#E0E7FF',
    color: '#4338CA',
  },
]

function AssessmentMobileModuleGrid({ activeKey }) {
  return (
    <section className="assessment-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Modul Penilaian">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola penilaian akademik siswa</span>
        </div>
      </div>

      <div className="master-mobile-grid assessment-mobile-grid-3col">
        {assessmentMobileTabs.map((tab) => {
          const isActive = tab.key === activeKey

          return (
            <Link
              key={tab.key}
              to={tab.route}
              className={`master-mobile-grid-item ${isActive ? 'active' : ''}`}
            >
              <div
                className="master-mobile-icon-box"
                style={{
                  backgroundColor: isActive ? '#008520' : tab.bg,
                  color: isActive ? '#FFFFFF' : tab.color,
                }}
              >
                <Icon name={tab.icon} />
              </div>
              <span className="master-mobile-item-label">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default AssessmentMobileModuleGrid
