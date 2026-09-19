import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import JournalMainView from '../../components/jurnal-mengajar/JournalMainView.jsx'
import {
  ClassActivitiesView,
  LearningMaterialsView,
  TeachingNotesView,
} from '../../components/jurnal-mengajar/JournalReviewViews.jsx'
import JournalTabs from '../../components/jurnal-mengajar/JournalTabs.jsx'
import {
  journalTabs,
  learningMaterials,
  recentJournalActivity,
  teachingJournals,
  teachingNotes,
} from '../../data/jurnalMengajar.js'
import './JurnalMengajar.css'

function JurnalMengajar() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const [journals, setJournals] = useState(() => teachingJournals.map((item) => ({ ...item })))
  const [materials, setMaterials] = useState(() => learningMaterials.map((item) => ({ ...item })))
  const [notes, setNotes] = useState(() => teachingNotes.map((item) => ({ ...item })))
  const [recentActivities, setRecentActivities] = useState(() => recentJournalActivity.map((item) => ({ ...item })))
  const activeTab = journalTabs.find((tab) => tab.route === location.pathname) ?? journalTabs[0]

  const views = {
    jurnal: (
      <JournalMainView
        journals={journals}
        onJournalsChange={setJournals}
        onNotify={setNotice}
        onRecentActivitiesChange={setRecentActivities}
        recentActivities={recentActivities}
      />
    ),
    materi: (
      <LearningMaterialsView
        items={materials}
        onItemsChange={setMaterials}
        onNotify={setNotice}
        onRecentActivitiesChange={setRecentActivities}
      />
    ),
    'aktivitas-kelas': <ClassActivitiesView journals={journals} onNotify={setNotice} />,
    catatan: (
      <TeachingNotesView
        items={notes}
        onItemsChange={setNotes}
        onNotify={setNotice}
        onRecentActivitiesChange={setRecentActivities}
      />
    ),
  }

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
      {views[activeTab.key]}

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
