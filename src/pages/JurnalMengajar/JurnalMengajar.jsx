import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import LiveJournalView from '../../components/jurnal-mengajar/LiveJournalView.jsx'
import JournalTabs from '../../components/jurnal-mengajar/JournalTabs.jsx'
import { journalTabs } from '../../config/journalTabs.js'
import './JurnalMengajar.css'

function JurnalMengajar() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = journalTabs.find((tab) => tab.route === location.pathname) ?? journalTabs[0]

  return (
    <section className="teaching-journal-page">
      <header className="teaching-journal-header">
        <div>
          <h2>Jurnal Mengajar</h2>
          <p>Catat aktivitas pembelajaran setiap pertemuan secara lengkap dan terstruktur</p>
        </div>
        <div className="teaching-journal-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Jurnal Mengajar', activeTab.label]} />
        </div>
      </header>

      <JournalTabs activeKey={activeTab.key} />
      {activeTab.key === 'jurnal' ? (
        <LiveJournalView onNotify={setNotice} />
      ) : (
        <div className="journal-live-state" role="status">
          Tampilan {activeTab.label} belum tersedia pada API jurnal mengajar.
        </div>
      )}

      {notice && (
        <div className="journal-toast" aria-live="polite" role="status">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default JurnalMengajar
