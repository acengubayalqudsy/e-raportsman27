import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import AssessmentSectionViews from '../../components/penilaian/AssessmentSectionViews.jsx'
import AssessmentSummary from '../../components/penilaian/AssessmentSummary.jsx'
import AssessmentTabs from '../../components/penilaian/AssessmentTabs.jsx'
import InputNilaiView from '../../components/penilaian/InputNilaiView.jsx'
import Icon from '../../components/common/Icon.jsx'
import { assessmentTabs } from '../../data/penilaian.js'
import './Penilaian.css'

function Penilaian() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = assessmentTabs.find((tab) => location.pathname.endsWith(`/${tab.key}`)) ?? assessmentTabs[0]

  return (
    <section className="assessment-page">
      <header className="assessment-header">
        <div>
          <h2>Penilaian</h2>
          <p>Kelola nilai akademik siswa dengan mudah dan terintegrasi</p>
        </div>
        <div className="assessment-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Penilaian', activeTab.label]} />
        </div>
      </header>

      <AssessmentTabs activeKey={activeTab.key} />
      <AssessmentSummary />

      {activeTab.key === 'input-nilai' ? (
        <InputNilaiView onNotify={setNotice} />
      ) : (
        <AssessmentSectionViews activeKey={activeTab.key} onNotify={setNotice} />
      )}

      {notice && (
        <div className="assessment-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default Penilaian
