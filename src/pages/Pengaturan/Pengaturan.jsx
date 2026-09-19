import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import SchoolIdentityView from '../../components/pengaturan/SchoolIdentityView.jsx'
import SettingsCategoryCards from '../../components/pengaturan/SettingsCategoryCards.jsx'
import {
  AcademicSettingsView,
  ActivityLogView,
  BackupRestoreView,
  ReportSettingsView,
  SystemSettingsView,
} from '../../components/pengaturan/SettingsViews.jsx'
import { initialSchoolIdentity, settingsTabs } from '../../data/pengaturan.js'
import './Pengaturan.css'

function Pengaturan() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState('')
  const activeTab = settingsTabs.find((tab) => tab.route === location.pathname) ?? settingsTabs[0]

  useLayoutEffect(() => {
    const contentWrapper = document.querySelector('.app-content-wrapper')
    contentWrapper?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    if (!notice) return undefined
    const timeoutId = window.setTimeout(() => setNotice(''), 3300)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined

    const warnBeforeLeave = (event) => event.preventDefault()
    const interceptInternalLink = (event) => {
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.pathname === location.pathname) return
      event.preventDefault()
      event.stopPropagation()
      setPendingNavigation(`${destination.pathname}${destination.search}${destination.hash}`)
    }

    window.addEventListener('beforeunload', warnBeforeLeave)
    document.addEventListener('click', interceptInternalLink, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeave)
      document.removeEventListener('click', interceptInternalLink, true)
    }
  }, [hasUnsavedChanges, location.pathname])

  useEffect(() => {
    if (!pendingNavigation) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setPendingNavigation('')
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [pendingNavigation])

  const requestNavigation = (route) => {
    if (hasUnsavedChanges) setPendingNavigation(route)
    else navigate(route)
  }

  const discardAndNavigate = () => {
    const destination = pendingNavigation
    setPendingNavigation('')
    setHasUnsavedChanges(false)
    navigate(destination)
  }

  const activeView = {
    'identitas-sekolah': (
      <SchoolIdentityView
        initialValue={initialSchoolIdentity}
        onDirtyChange={setHasUnsavedChanges}
        onNotify={setNotice}
        onOpenBackup={() => requestNavigation('/pengaturan/backup-restore')}
      />
    ),
    akademik: <AcademicSettingsView onDirtyChange={setHasUnsavedChanges} onNotify={setNotice} />,
    rapor: <ReportSettingsView onDirtyChange={setHasUnsavedChanges} onNotify={setNotice} />,
    sistem: <SystemSettingsView onDirtyChange={setHasUnsavedChanges} onNotify={setNotice} />,
    'backup-restore': <BackupRestoreView onNotify={setNotice} />,
    'log-aktivitas': <ActivityLogView onNotify={setNotice} />,
  }[activeTab.key]

  return (
    <section className="settings-page">
      <header className="settings-page-header">
        <div><h2>Pengaturan</h2><p>Kelola konfigurasi aplikasi e-Raport sesuai kebutuhan sekolah</p></div>
        <div className="settings-breadcrumb"><Breadcrumb items={['Dashboard', 'Pengaturan', activeTab.label]} /></div>
      </header>

      <SettingsCategoryCards activeKey={activeTab.key} items={settingsTabs} />
      {activeView}

      {notice && (
        <div aria-live="polite" className="settings-toast" role="status">
          <Icon name="checkCircle" /><span>{notice}</span>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}

      {pendingNavigation && (
        <div className="settings-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingNavigation('') }} role="presentation">
          <section aria-labelledby="settings-leave-title" aria-modal="true" className="settings-confirm-modal" role="dialog">
            <header><span><Icon name="info" /></span><div><h3 id="settings-leave-title">Perubahan belum disimpan</h3><p>Konfirmasi pindah halaman</p></div></header>
            <p>Anda memiliki perubahan yang belum disimpan. Pindah halaman akan membatalkan perubahan tersebut.</p>
            <footer><button className="settings-button danger" onClick={discardAndNavigate} type="button">Batalkan Perubahan</button><button autoFocus className="settings-button primary" onClick={() => setPendingNavigation('')} type="button">Tetap di Halaman</button></footer>
          </section>
        </div>
      )}
    </section>
  )
}

export default Pengaturan
