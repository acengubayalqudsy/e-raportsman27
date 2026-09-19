import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import DaftarRaporView from '../../components/rapor/DaftarRaporView.jsx'
import RaporSectionViews from '../../components/rapor/RaporSectionViews.jsx'
import RaporTabs from '../../components/rapor/RaporTabs.jsx'
import { raporTabs } from '../../data/rapor.js'
import './RaporLeger.css'

function RaporLeger() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = raporTabs.find((tab) => location.pathname.endsWith(`/${tab.key}`)) ?? raporTabs[0]

  return (
    <section className="report-page">
      <header className="report-header">
        <div>
          <h2>Rapor &amp; Leger</h2>
          <p>Kelola rapor, leger, dan dokumen akademik siswa</p>
        </div>
        <div className="report-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Rapor & Leger', activeTab.label]} />
        </div>
      </header>

      <RaporTabs activeKey={activeTab.key} />

      {activeTab.key === 'daftar-rapor' ? (
        <DaftarRaporView onNotify={setNotice} />
      ) : (
        <RaporSectionViews activeKey={activeTab.key} onNotify={setNotice} />
      )}

      {notice && (
        <div className="report-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default RaporLeger
