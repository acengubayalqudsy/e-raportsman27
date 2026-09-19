import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  activityLogs,
  backupHistory,
  initialAcademicSettings,
  initialReportSettings,
  initialSystemSettings,
  settingsOptions,
} from '../../data/pengaturan.js'

const COMPONENT_LABELS = {
  academicScores: 'Nilai Akademik',
  competencyAchievement: 'Capaian Kompetensi',
  attitudeScores: 'Nilai Sikap',
  extracurricular: 'Ekstrakurikuler',
  cocurricular: 'Kokurikuler',
  attendance: 'Absensi',
  homeroomNotes: 'Catatan Wali Kelas',
  signatures: 'Tanda Tangan',
}

let academicSessionSettings = { ...initialAcademicSettings }
let reportSessionSettings = { ...initialReportSettings, components: { ...initialReportSettings.components } }
let systemSessionSettings = { ...initialSystemSettings }
let backupSessionHistory = [...backupHistory]

function isSameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function useDirtyReporter(dirty, onDirtyChange) {
  useEffect(() => {
    onDirtyChange?.(dirty)
    return () => onDirtyChange?.(false)
  }, [dirty, onDirtyChange])
}

function FormSection({ children, description, icon, title }) {
  return (
    <section className="settings-section">
      <header className="settings-section-header">
        <span className="settings-section-icon"><Icon name={icon} /></span>
        <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
      </header>
      {children}
    </section>
  )
}

function Field({ children, error, label, wide = false }) {
  return (
    <label className={`settings-field${wide ? ' settings-field-wide' : ''}${error ? ' has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}

function Toggle({ checked, description, label, onChange }) {
  return (
    <div className="settings-toggle-item">
      <div><strong>{label}</strong>{description && <small>{description}</small>}</div>
      <button
        aria-checked={checked}
        aria-label={`${checked ? 'Nonaktifkan' : 'Aktifkan'} ${label}`}
        className={`settings-toggle${checked ? ' active' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span />
      </button>
    </div>
  )
}

function SettingsModal({ children, description, onClose, title }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="settings-modal-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
      role="presentation"
    >
      <section aria-labelledby="settings-modal-title" aria-modal="true" className="settings-modal" ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className="settings-modal-header">
          <div><h3 id="settings-modal-title">{title}</h3>{description && <p>{description}</p>}</div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )
}

function ConfirmModal({ confirmLabel, description, detail, isDanger = false, onCancel, onConfirm, title }) {
  return (
    <SettingsModal description={description} onClose={onCancel} title={title}>
      {detail && <div className={`settings-confirm-detail${isDanger ? ' danger' : ''}`}>{detail}</div>}
      <footer className="settings-modal-actions">
        <Button className="settings-secondary-button" onClick={onCancel}>Batal</Button>
        <Button className={isDanger ? 'settings-danger-button' : 'settings-primary-button'} onClick={onConfirm}>{confirmLabel}</Button>
      </footer>
    </SettingsModal>
  )
}

function FormActions({ dirty, isSaving, onReset, onSave }) {
  return (
    <footer className="settings-view-actions">
      <span className={`settings-unsaved-indicator${dirty ? ' visible' : ''}`}>
        {dirty ? 'Perubahan belum disimpan' : 'Semua perubahan tersimpan'}
      </span>
      <Button className="settings-secondary-button" disabled={!dirty || isSaving} onClick={onReset}>
        <Icon name="reset" />Reset
      </Button>
      <Button className="settings-primary-button" disabled={!dirty || isSaving} onClick={onSave}>
        {isSaving ? <span className="settings-spinner" /> : <Icon name="save" />}
        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </footer>
  )
}

function useDelayedAction() {
  const timerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const delay = (callback, duration = 450) => {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(callback, duration)
  }

  return delay
}

export function AcademicSettingsView({ onDirtyChange, onNotify }) {
  const [form, setForm] = useState(() => ({ ...academicSessionSettings }))
  const [saved, setSaved] = useState(() => ({ ...academicSessionSettings }))
  const [dirty, setDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingContext, setPendingContext] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const delay = useDelayedAction()
  useDirtyReporter(dirty, onDirtyChange)

  const update = (key, value) => {
    if (isSaving) return
    setForm((current) => {
      const next = { ...current, [key]: value }
      setDirty(!isSameValue(next, saved))
      return next
    })
    setError('')
  }

  const requestContextChange = (key, value) => {
    if (isSaving) return
    if (value === form[key]) return
    setPendingContext({ key, from: form[key], to: value })
  }

  const applyContextChange = () => {
    update(pendingContext.key, pendingContext.to)
    setPendingContext(null)
  }

  const save = () => {
    if (!form.academicYear || !form.semester || !form.semesterStartDate || !form.semesterEndDate) {
      setError('Lengkapi tahun ajaran, semester, dan rentang tanggal semester.')
      return
    }
    if (form.semesterStartDate > form.semesterEndDate) {
      setError('Tanggal akhir semester harus setelah tanggal mulai semester.')
      return
    }
    if (Number(form.schoolDays) < 1) {
      setError('Jumlah hari sekolah minimal 1 hari.')
      return
    }
    setIsSaving(true)
    delay(() => {
      const next = { ...form }
      academicSessionSettings = next
      setSaved(next)
      setDirty(false)
      setIsSaving(false)
      onNotify?.('Pengaturan akademik berhasil diperbarui.')
    })
  }

  const reset = () => {
    setForm({ ...saved })
    setDirty(false)
    setError('')
    setConfirmReset(false)
    onNotify?.('Perubahan pengaturan akademik dibatalkan.')
  }

  return (
    <div className="settings-view settings-form-view">
      <div className="settings-panel settings-form-panel">
        <div className="settings-panel-heading">
          <div><h2>Pengaturan Akademik</h2><p>Tentukan konteks periode dan aturan akademik global dari data Master Data.</p></div>
          <span className="settings-context-chip"><Icon name="calendar" />Konteks Aktif</span>
        </div>

        {error && <div className="settings-inline-alert error"><Icon name="info" /><span>{error}</span></div>}

        <FormSection description="Perubahan tahun ajaran atau semester memerlukan konfirmasi." icon="calendar" title="Konteks Akademik Aktif">
          <div className="settings-form-grid">
            <Field label="Tahun Ajaran Aktif">
              <select value={form.academicYear} onChange={(event) => requestContextChange('academicYear', event.target.value)}>
                {settingsOptions.academicYears.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Semester Aktif">
              <select value={form.semester} onChange={(event) => requestContextChange('semester', event.target.value)}>
                {settingsOptions.semesters.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Tanggal Mulai Semester"><input type="date" value={form.semesterStartDate} onChange={(event) => update('semesterStartDate', event.target.value)} /></Field>
            <Field label="Tanggal Akhir Semester"><input type="date" value={form.semesterEndDate} onChange={(event) => update('semesterEndDate', event.target.value)} /></Field>
            <Field label="Tanggal Pembagian Rapor"><input type="date" value={form.reportDistributionDate} onChange={(event) => update('reportDistributionDate', event.target.value)} /></Field>
            <Field label="Jumlah Hari Sekolah"><input min="1" type="number" value={form.schoolDays} onChange={(event) => update('schoolDays', Number(event.target.value))} /></Field>
            <Field label="Format Nama Kelas">
              <select value={form.classNameFormat} onChange={(event) => update('classNameFormat', event.target.value)}>
                {settingsOptions.classNameFormats.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection description="Toggle berikut hanya mengubah konfigurasi mock pada frontend." icon="sliders" title="Akses Modul Akademik">
          <div className="settings-toggle-list">
            <Toggle checked={form.semesterEnabled} description="Mengaktifkan konteks semester terpilih." label="Aktifkan Semester" onChange={(value) => update('semesterEnabled', value)} />
            <Toggle checked={form.scoreInputEnabled} description="Izinkan pengisian nilai pada periode aktif." label="Aktifkan Input Nilai" onChange={(value) => update('scoreInputEnabled', value)} />
            <Toggle checked={form.attendanceInputEnabled} description="Izinkan pencatatan absensi pada periode aktif." label="Aktifkan Pengisian Absensi" onChange={(value) => update('attendanceInputEnabled', value)} />
            <Toggle checked={form.reportGenerationEnabled} description="Izinkan simulasi generate rapor." label="Aktifkan Generate Rapor" onChange={(value) => update('reportGenerationEnabled', value)} />
          </div>
        </FormSection>

        <FormActions dirty={dirty} isSaving={isSaving} onReset={() => setConfirmReset(true)} onSave={save} />
      </div>

      <aside className="settings-side-stack">
        <section className="settings-info-card settings-info-blue">
          <header><Icon name="info" /><h3>Sumber Konfigurasi</h3></header>
          <p>Tahun ajaran dan semester berasal dari Master Data. Halaman ini hanya menentukan konteks yang sedang aktif.</p>
        </section>
        <section className="settings-info-card settings-info-warning">
          <header><Icon name="info" /><h3>Perhatian</h3></header>
          <p>Perubahan konteks mempengaruhi data yang ditampilkan pada Akademik, Penilaian, Absensi, Rapor, dan Laporan.</p>
        </section>
      </aside>

      {pendingContext && (
        <ConfirmModal
          confirmLabel={`Ubah ${pendingContext.key === 'academicYear' ? 'Tahun Ajaran' : 'Semester'}`}
          description="Perubahan ini akan mengubah konteks data yang ditampilkan pada aplikasi."
          detail={<div className="settings-context-comparison"><span><small>Dari</small><strong>{pendingContext.from}</strong></span><Icon name="arrowRight" /><span><small>Menjadi</small><strong>{pendingContext.to}</strong></span></div>}
          onCancel={() => setPendingContext(null)}
          onConfirm={applyContextChange}
          title={`Ubah ${pendingContext.key === 'academicYear' ? 'Tahun Ajaran' : 'Semester'} Aktif?`}
        />
      )}
      {confirmReset && <ConfirmModal confirmLabel="Reset Pengaturan" description="Kembalikan semua perubahan ke nilai terakhir yang tersimpan?" onCancel={() => setConfirmReset(false)} onConfirm={reset} title="Reset Pengaturan Akademik" />}
    </div>
  )
}

export function ReportSettingsView({ onDirtyChange, onNotify }) {
  const [form, setForm] = useState(() => ({ ...reportSessionSettings, components: { ...reportSessionSettings.components } }))
  const [saved, setSaved] = useState(() => ({ ...reportSessionSettings, components: { ...reportSessionSettings.components } }))
  const [dirty, setDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const delay = useDelayedAction()
  useDirtyReporter(dirty, onDirtyChange)

  const update = (key, value) => {
    if (isSaving) return
    setForm((current) => {
      const next = { ...current, [key]: value }
      setDirty(!isSameValue(next, saved))
      return next
    })
  }
  const updateComponent = (key, value) => {
    if (isSaving) return
    setForm((current) => {
      const next = { ...current, components: { ...current.components, [key]: value } }
      setDirty(!isSameValue(next, saved))
      return next
    })
  }
  const save = () => {
    setIsSaving(true)
    delay(() => {
      const next = { ...form, components: { ...form.components } }
      reportSessionSettings = next
      setSaved(next)
      setDirty(false)
      setIsSaving(false)
      onNotify?.('Pengaturan rapor berhasil diperbarui.')
    })
  }
  const reset = () => {
    setForm({ ...saved, components: { ...saved.components } })
    setDirty(false)
    setConfirmReset(false)
    onNotify?.('Perubahan pengaturan rapor dibatalkan.')
  }

  return (
    <div className="settings-view settings-form-view">
      <div className="settings-panel settings-form-panel">
        <div className="settings-panel-heading">
          <div><h2>Pengaturan Rapor</h2><p>Atur format visual dan komponen dokumen rapor.</p></div>
          <Button className="settings-outline-button" onClick={() => setPreviewOpen(true)}><Icon name="eye" />Preview Rapor</Button>
        </div>

        <FormSection description="Preferensi dasar dokumen saat ditampilkan atau dicetak." icon="report" title="Format Rapor">
          <div className="settings-form-grid settings-form-grid-three">
            <Field label="Format Rapor"><select value={form.reportFormat} onChange={(event) => update('reportFormat', event.target.value)}>{settingsOptions.reportFormats.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Ukuran Kertas"><select value={form.paperSize} onChange={(event) => update('paperSize', event.target.value)}>{settingsOptions.paperSizes.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Orientasi"><select value={form.orientation} onChange={(event) => update('orientation', event.target.value)}>{settingsOptions.orientations.map((option) => <option key={option}>{option}</option>)}</select></Field>
          </div>
          <div className="settings-toggle-grid">
            <Toggle checked={form.showSchoolLogo} label="Tampilkan Logo Sekolah" onChange={(value) => update('showSchoolLogo', value)} />
            <Toggle checked={form.showNis} label="Tampilkan NIS" onChange={(value) => update('showNis', value)} />
            <Toggle checked={form.showNisn} label="Tampilkan NISN" onChange={(value) => update('showNisn', value)} />
            <Toggle checked={form.showStudentPhoto} label="Tampilkan Foto Siswa" onChange={(value) => update('showStudentPhoto', value)} />
          </div>
        </FormSection>

        <FormSection description="Pilih bagian yang ditampilkan pada dokumen rapor." icon="clipboardCheck" title="Komponen Rapor">
          <div className="settings-component-grid">
            {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
              <label className="settings-checkbox-item" key={key}>
                <input checked={form.components[key]} onChange={(event) => updateComponent(key, event.target.checked)} type="checkbox" />
                <span><Icon name="check" /></span><strong>{label}</strong>
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection description="Atur kepadatan informasi capaian kompetensi." icon="book" title="Capaian Kompetensi">
          <div className="settings-form-grid">
            <Field label="Panjang Deskripsi"><select value={form.descriptionLength} onChange={(event) => update('descriptionLength', event.target.value)}>{settingsOptions.descriptionLengths.map((option) => <option key={option}>{option}</option>)}</select></Field>
          </div>
          <div className="settings-toggle-grid">
            <Toggle checked={form.showNumericScore} label="Tampilkan Nilai Angka" onChange={(value) => update('showNumericScore', value)} />
            <Toggle checked={form.showPredicate} label="Tampilkan Predikat" onChange={(value) => update('showPredicate', value)} />
            <Toggle checked={form.showDescription} label="Tampilkan Deskripsi" onChange={(value) => update('showDescription', value)} />
          </div>
        </FormSection>

        <FormActions dirty={dirty} isSaving={isSaving} onReset={() => setConfirmReset(true)} onSave={save} />
      </div>

      <aside className="settings-side-stack">
        <section className="settings-info-card">
          <header><Icon name="award" /><h3>Predikat Nilai</h3></header>
          <div className="settings-predicate-list">
            {form.predicates.map((item) => <div key={item.grade}><b>{item.grade}</b><span>{item.range}</span><small>{item.label}</small></div>)}
          </div>
          <p className="settings-card-note">Rentang ini hanya contoh konfigurasi frontend, bukan kebijakan final sekolah.</p>
        </section>
        <section className="settings-info-card settings-info-blue">
          <header><Icon name="info" /><h3>Tips</h3></header>
          <p>Gunakan Preview Rapor untuk memeriksa komponen dan format sebelum menyimpan perubahan.</p>
        </section>
      </aside>

      {previewOpen && (
        <SettingsModal description="Contoh HTML menggunakan data siswa mock." onClose={() => setPreviewOpen(false)} title="Preview Rapor">
          <div className={`settings-report-preview ${form.orientation.toLowerCase()}`}>
            <header>{form.showSchoolLogo && <span className="settings-preview-logo"><Icon name="academic" /></span>}<div><small>PEMERINTAH PROVINSI JAWA BARAT</small><h3>SMAN 27 GARUT</h3><p>LAPORAN HASIL BELAJAR PESERTA DIDIK</p></div></header>
            <dl><div><dt>Nama</dt><dd>ACEP HASANUL IHWAN</dd></div>{form.showNis && <div><dt>NIS</dt><dd>252610001</dd></div>}{form.showNisn && <div><dt>NISN</dt><dd>0093864667</dd></div>}<div><dt>Kelas</dt><dd>X Merdeka 3</dd></div></dl>
            {form.components.academicScores && <div className="settings-preview-table"><strong>Matematika</strong>{form.showNumericScore && <b>84,50</b>}{form.showPredicate && <span>A-</span>}{form.showDescription && <p>Menunjukkan penguasaan yang baik pada materi semester ini.</p>}</div>}
            <small className="settings-preview-caption">Preview {form.reportFormat} · {form.paperSize} · {form.orientation}</small>
          </div>
          <footer className="settings-modal-actions"><Button className="settings-secondary-button" onClick={() => setPreviewOpen(false)}>Tutup Preview</Button></footer>
        </SettingsModal>
      )}
      {confirmReset && <ConfirmModal confirmLabel="Reset Pengaturan" description="Kembalikan konfigurasi rapor ke nilai terakhir yang tersimpan?" onCancel={() => setConfirmReset(false)} onConfirm={reset} title="Reset Pengaturan Rapor" />}
    </div>
  )
}

export function SystemSettingsView({ onDirtyChange, onNotify }) {
  const [form, setForm] = useState(() => ({ ...systemSessionSettings }))
  const [saved, setSaved] = useState(() => ({ ...systemSessionSettings }))
  const [dirty, setDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const delay = useDelayedAction()
  useDirtyReporter(dirty, onDirtyChange)

  const update = (key, value) => {
    if (isSaving) return
    setForm((current) => {
      const next = { ...current, [key]: value }
      setDirty(!isSameValue(next, saved))
      return next
    })
  }
  const save = () => {
    setIsSaving(true)
    delay(() => {
      const next = { ...form }
      systemSessionSettings = next
      setSaved(next)
      setDirty(false)
      setIsSaving(false)
      onNotify?.('Pengaturan sistem berhasil diperbarui.')
    })
  }
  const reset = () => {
    setForm({ ...saved })
    setDirty(false)
    setConfirmReset(false)
    onNotify?.('Perubahan pengaturan sistem dibatalkan.')
  }

  return (
    <div className="settings-view settings-form-view">
      <div className="settings-panel settings-form-panel">
        <div className="settings-panel-heading"><div><h2>Pengaturan Sistem</h2><p>Kelola preferensi aplikasi, antarmuka, dan notifikasi frontend.</p></div></div>

        <FormSection description="Informasi dan format dasar yang digunakan pada antarmuka." icon="settings" title="Preferensi Aplikasi">
          <div className="settings-form-grid">
            <Field label="Nama Aplikasi"><input value={form.applicationName} onChange={(event) => update('applicationName', event.target.value)} /></Field>
            <Field label="Versi"><input disabled value={form.version} /></Field>
            <Field label="Bahasa"><select value={form.language} onChange={(event) => update('language', event.target.value)}>{settingsOptions.languages.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Format Tanggal"><select value={form.dateFormat} onChange={(event) => update('dateFormat', event.target.value)}>{settingsOptions.dateFormats.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Zona Waktu"><select value={form.timezone} onChange={(event) => update('timezone', event.target.value)}>{settingsOptions.timezones.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Data per Halaman"><select value={form.defaultItemsPerPage} onChange={(event) => update('defaultItemsPerPage', event.target.value)}>{settingsOptions.itemsPerPage.map((option) => <option key={option}>{option}</option>)}</select></Field>
          </div>
        </FormSection>

        <FormSection description="Preferensi tampilan hanya diterapkan pada simulasi frontend." icon="sliders" title="Antarmuka">
          <div className="settings-form-grid"><Field label="Sidebar Default"><select value={form.sidebarDefault} onChange={(event) => update('sidebarDefault', event.target.value)}>{settingsOptions.sidebarModes.map((option) => <option key={option}>{option}</option>)}</select></Field></div>
          <div className="settings-toggle-grid">
            <Toggle checked={form.compactTable} label="Tabel Ringkas" onChange={(value) => update('compactTable', value)} />
            <Toggle checked={form.showBreadcrumb} label="Tampilkan Breadcrumb" onChange={(value) => update('showBreadcrumb', value)} />
            <Toggle checked={form.interfaceAnimation} label="Animasi Antarmuka" onChange={(value) => update('interfaceAnimation', value)} />
          </div>
        </FormSection>

        <FormSection description="Semua notifikasi masih berupa preferensi visual lokal." icon="bell" title="Notifikasi">
          <div className="settings-toggle-list">
            <Toggle checked={form.systemNotifications} label="Notifikasi Sistem" onChange={(value) => update('systemNotifications', value)} />
            <Toggle checked={form.incompleteScoreNotifications} label="Notifikasi Nilai Belum Lengkap" onChange={(value) => update('incompleteScoreNotifications', value)} />
            <Toggle checked={form.printableReportNotifications} label="Notifikasi Rapor Siap Dicetak" onChange={(value) => update('printableReportNotifications', value)} />
            <Toggle checked={form.activityNotifications} label="Notifikasi Aktivitas Sistem" onChange={(value) => update('activityNotifications', value)} />
          </div>
        </FormSection>

        <FormSection description="Pengaturan berikut belum menerapkan keamanan backend." icon="shield" title="Presentasi Keamanan">
          <div className="settings-form-grid"><Field label="Batas Waktu Sesi"><select value={form.sessionTimeout} onChange={(event) => update('sessionTimeout', event.target.value)}>{settingsOptions.sessionTimeouts.map((option) => <option key={option}>{option}</option>)}</select></Field></div>
          <div className="settings-toggle-list"><Toggle checked={form.confirmImportantActions} label="Konfirmasi Sebelum Aksi Penting" onChange={(value) => update('confirmImportantActions', value)} /></div>
        </FormSection>

        <FormActions dirty={dirty} isSaving={isSaving} onReset={() => setConfirmReset(true)} onSave={save} />
      </div>

      <aside className="settings-side-stack">
        <section className="settings-info-card settings-info-blue"><header><Icon name="info" /><h3>Status Implementasi</h3></header><dl className="settings-key-value"><div><dt>Konfigurasi</dt><dd>Local State</dd></div><div><dt>Backend</dt><dd>Belum terintegrasi</dd></div><div><dt>Database</dt><dd>Belum terintegrasi</dd></div></dl></section>
        <section className="settings-info-card settings-info-warning"><header><Icon name="info" /><h3>Catatan</h3></header><p>Opsi sesi dan notifikasi ini belum mengaktifkan security atau push notification sebenarnya.</p></section>
      </aside>

      {confirmReset && <ConfirmModal confirmLabel="Reset Pengaturan" description="Kembalikan preferensi sistem ke nilai terakhir yang tersimpan?" onCancel={() => setConfirmReset(false)} onConfirm={reset} title="Reset Pengaturan Sistem" />}
    </div>
  )
}

export function BackupRestoreView({ onNotify }) {
  const [history, setHistory] = useState(() => [...backupSessionHistory])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [modal, setModal] = useState('')
  const [selectedBackupId, setSelectedBackupId] = useState(backupSessionHistory[0]?.id ?? '')
  const [loading, setLoading] = useState('')
  const delay = useDelayedAction()

  const totalPages = Math.ceil(history.length / rowsPerPage)
  const visibleRows = history.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const latest = history[0]

  const startBackup = () => {
    setModal('')
    setLoading('backup')
    delay(() => {
      const now = new Date()
      const newBackup = {
        id: `BKP-SIM-${now.getTime()}`,
        createdAt: `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(now)} WIB`,
        createdAtIso: now.toISOString(),
        createdBy: 'Administrator',
        size: '24,8 MB',
        status: 'Berhasil',
        type: 'Simulasi Manual',
        isMock: true,
      }
      setHistory((current) => {
        const next = [newBackup, ...current]
        backupSessionHistory = next
        return next
      })
      setSelectedBackupId(newBackup.id)
      setCurrentPage(1)
      setLoading('')
      onNotify?.('Backup simulasi berhasil dibuat. Tidak ada file atau database yang dicadangkan.')
    }, 650)
  }

  const startRestore = () => {
    setModal('')
    setLoading('restore')
    delay(() => {
      setLoading('')
      onNotify?.('Simulasi restore selesai. Tidak ada data aplikasi yang diubah.')
    }, 650)
  }

  const selectedBackup = history.find((item) => item.id === selectedBackupId) ?? latest

  return (
    <div className="settings-view settings-data-view">
      <section className="settings-backup-summary settings-panel">
        <div className="settings-panel-heading"><div><h2>Backup & Restore</h2><p>Simulasikan pencadangan dan pemulihan data melalui antarmuka frontend.</p></div><span className="settings-mock-badge">Simulasi Frontend</span></div>
        <div className="settings-summary-grid">
          <article className="settings-summary-card"><span><Icon name="clock" /></span><div><small>Backup Terakhir</small><strong>{latest?.createdAt ?? '-'}</strong></div></article>
          <article className="settings-summary-card"><span><Icon name="document" /></span><div><small>Ukuran</small><strong>{latest?.size ?? '-'}</strong></div></article>
          <article className="settings-summary-card"><span><Icon name="checkCircle" /></span><div><small>Status</small><strong>{latest?.status ?? 'Belum Ada'}</strong></div></article>
        </div>
        <div className="settings-backup-actions">
          <Button className="settings-primary-button" disabled={Boolean(loading)} onClick={() => setModal('backup')}>
            {loading === 'backup' ? <span className="settings-spinner" /> : <Icon name="cloudUpload" />}{loading === 'backup' ? 'Membuat Backup...' : 'Backup Sekarang'}
          </Button>
          <Button className="settings-outline-button" disabled={!history.length || Boolean(loading)} onClick={() => setModal('restore')}>
            {loading === 'restore' ? <span className="settings-spinner" /> : <Icon name="reset" />}{loading === 'restore' ? 'Memulihkan...' : 'Restore Data'}
          </Button>
        </div>
      </section>

      <section className="settings-panel settings-table-panel">
        <div className="settings-panel-heading"><div><h2>Riwayat Backup</h2><p>Daftar berikut merupakan data mock dan tidak merepresentasikan file backup sebenarnya.</p></div><span className="settings-count-badge">{history.length} riwayat</span></div>
        {visibleRows.length ? (
          <>
            <div className="settings-table-scroll">
              <table className="settings-data-table">
                <thead><tr><th>No</th><th>Tanggal</th><th>Dibuat Oleh</th><th>Jenis</th><th>Ukuran</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>{visibleRows.map((item, index) => <tr key={item.id}><td>{(currentPage - 1) * rowsPerPage + index + 1}</td><td><strong>{item.createdAt}</strong><small>{item.id}</small></td><td>{item.createdBy}</td><td>{item.type}</td><td>{item.size}</td><td><span className="settings-status-badge success">{item.status}</span></td><td><Button aria-label={`Restore dari ${item.createdAt}`} className="settings-icon-button" onClick={() => { setSelectedBackupId(item.id); setModal('restore') }}><Icon name="reset" /></Button></td></tr>)}</tbody>
              </table>
            </div>
            <MasterPagination currentPage={currentPage} itemLabel="riwayat" onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={history.length} totalPages={totalPages} />
          </>
        ) : (
          <EmptyState className="settings-empty"><Icon name="cloudUpload" /><h3>Belum ada riwayat backup</h3><p>Backup sebenarnya akan tersedia setelah integrasi backend.</p></EmptyState>
        )}
      </section>

      <section className="settings-inline-alert info"><Icon name="info" /><div><strong>Fitur masih berupa simulasi frontend</strong><p>Proses pencadangan dan pemulihan data sebenarnya membutuhkan integrasi backend serta database.</p></div></section>

      {modal === 'backup' && <ConfirmModal confirmLabel="Buat Backup Simulasi" description="Tindakan ini hanya menambahkan riwayat mock pada halaman dan tidak membuat file backup." detail="Pastikan Anda memahami bahwa belum ada backend atau database yang dicadangkan." onCancel={() => setModal('')} onConfirm={startBackup} title="Backup Sekarang?" />}
      {modal === 'restore' && (
        <SettingsModal description="Pilih data backup mock yang akan digunakan pada simulasi." onClose={() => setModal('')} title="Restore Data">
          <div className="settings-modal-body">
            <Field label="Pilih Backup">
              <select value={selectedBackupId} onChange={(event) => setSelectedBackupId(event.target.value)}>{history.map((item) => <option key={item.id} value={item.id}>{item.createdAt} · {item.size}</option>)}</select>
            </Field>
            <div className="settings-confirm-detail danger"><strong>Perhatian</strong><p>Restore biasanya menggantikan kondisi data dengan backup terpilih. Pada fase ini proses hanya simulasi dan tidak mengubah data apa pun.</p>{selectedBackup && <small>Dipilih: {selectedBackup.id}</small>}</div>
          </div>
          <footer className="settings-modal-actions"><Button className="settings-secondary-button" onClick={() => setModal('')}>Batal</Button><Button className="settings-danger-button" onClick={startRestore}>Simulasikan Restore</Button></footer>
        </SettingsModal>
      )}
    </div>
  )
}

function matchesActivityType(log, filter) {
  if (filter === 'Semua Aktivitas') return true
  const value = `${log.activity} ${log.module}`.toLowerCase()
  const keywords = {
    'Tambah Data': ['menambah'],
    'Ubah Data': ['mengubah', 'memperbarui'],
    'Input Nilai': ['nilai'],
    Absensi: ['absensi', 'izin'],
    Jurnal: ['jurnal'],
    'Generate Rapor': ['generate rapor'],
    Laporan: ['laporan'],
    Pengaturan: ['pengaturan', 'konteks akademik'],
    Backup: ['backup'],
    Restore: ['restore'],
  }
  return (keywords[filter] ?? [filter.toLowerCase()]).some((keyword) => value.includes(keyword))
}

function matchesDateRange(logDate, range, latestDate) {
  if (range === 'Semua Tanggal') return true
  const date = new Date(`${logDate}T00:00:00`)
  const anchor = new Date(`${latestDate}T00:00:00`)
  const difference = Math.floor((anchor - date) / 86400000)
  if (range === 'Hari Ini') return difference === 0
  if (range === '7 Hari Terakhir') return difference >= 0 && difference < 7
  if (range === '30 Hari Terakhir') return difference >= 0 && difference < 30
  return true
}

export function ActivityLogView({ onNotify }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ dateRange: 'Semua Tanggal', user: 'Semua Pengguna', role: 'Semua Role', module: 'Semua Modul', activity: 'Semua Aktivitas', status: 'Semua Status' })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [selectedLog, setSelectedLog] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const delay = useDelayedAction()
  const latestDate = useMemo(() => [...activityLogs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? '', [])

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return activityLogs.filter((log) => {
      const haystack = `${log.timestamp} ${log.user} ${log.role} ${log.module} ${log.activity} ${log.target} ${log.status} ${log.detail}`.toLowerCase()
      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (filters.user === 'Semua Pengguna' || log.user === filters.user)
        && (filters.role === 'Semua Role' || log.role === filters.role)
        && (filters.module === 'Semua Modul' || log.module === filters.module)
        && (filters.status === 'Semua Status' || log.status === filters.status)
        && matchesActivityType(log, filters.activity)
        && matchesDateRange(log.date, filters.dateRange, latestDate)
    })
  }, [filters, latestDate, query])

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage)
  const visibleRows = filteredLogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }
  const clearFilters = () => {
    setQuery('')
    setFilters({ dateRange: 'Semua Tanggal', user: 'Semua Pengguna', role: 'Semua Role', module: 'Semua Modul', activity: 'Semua Aktivitas', status: 'Semua Status' })
    setCurrentPage(1)
  }
  const refresh = () => {
    setIsRefreshing(true)
    delay(() => {
      setIsRefreshing(false)
      onNotify?.('Log aktivitas mock berhasil dimuat ulang.')
    })
  }

  return (
    <div className="settings-view settings-data-view">
      <section className="settings-panel settings-filter-panel">
        <div className="settings-panel-heading"><div><h2>Log Aktivitas</h2><p>Telusuri riwayat aktivitas pengguna dari data mock frontend.</p></div><Button className="settings-outline-button" disabled={isRefreshing} onClick={refresh}>{isRefreshing ? <span className="settings-spinner" /> : <Icon name="reset" />}{isRefreshing ? 'Memuat...' : 'Refresh Log'}</Button></div>
        <div className="settings-filter-bar">
          <label className="settings-search"><span>Cari Aktivitas</span><div><input placeholder="Cari pengguna, modul, target..." value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }} /><Icon name="search" /></div></label>
          <Field label="Tanggal"><select value={filters.dateRange} onChange={(event) => updateFilter('dateRange', event.target.value)}>{settingsOptions.dateRanges.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Pengguna"><select value={filters.user} onChange={(event) => updateFilter('user', event.target.value)}>{settingsOptions.users.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Role"><select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)}>{settingsOptions.roles.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Modul"><select value={filters.module} onChange={(event) => updateFilter('module', event.target.value)}>{settingsOptions.modules.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Jenis Aktivitas"><select value={filters.activity} onChange={(event) => updateFilter('activity', event.target.value)}>{settingsOptions.activityTypes.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Status"><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{settingsOptions.activityStatuses.map((option) => <option key={option}>{option}</option>)}</select></Field>
        </div>
      </section>

      <section className="settings-panel settings-table-panel">
        <div className="settings-panel-heading"><div><h2>Riwayat Aktivitas</h2><p>Data sensitif seperti password, token, atau credential tidak ditampilkan.</p></div><span className="settings-count-badge">{filteredLogs.length} aktivitas</span></div>
        {visibleRows.length ? (
          <>
            <div className="settings-table-scroll">
              <table className="settings-data-table settings-log-table">
                <thead><tr><th>No</th><th>Waktu</th><th>Pengguna</th><th>Role</th><th>Modul</th><th>Aktivitas</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>{visibleRows.map((log, index) => <tr key={log.id}><td>{(currentPage - 1) * rowsPerPage + index + 1}</td><td>{log.timestamp}</td><td><strong>{log.user}</strong></td><td>{log.role}</td><td>{log.module}</td><td><strong>{log.activity}</strong><small>{log.target}</small></td><td><span className={`settings-status-badge ${log.status === 'Berhasil' ? 'success' : log.status === 'Menunggu' ? 'pending' : 'muted'}`}>{log.status}</span></td><td><Button aria-label={`Lihat detail ${log.activity}`} className="settings-icon-button" onClick={() => setSelectedLog(log)}><Icon name="eye" /></Button></td></tr>)}</tbody>
              </table>
            </div>
            <MasterPagination currentPage={currentPage} itemLabel="aktivitas" onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={filteredLogs.length} totalPages={totalPages} />
          </>
        ) : (
          <EmptyState className="settings-empty"><Icon name="search" /><h3>Tidak ada aktivitas yang sesuai</h3><p>Ubah kata kunci atau filter untuk melihat data lainnya.</p><Button className="settings-outline-button" onClick={clearFilters}>Reset Filter</Button></EmptyState>
        )}
      </section>

      <section className="settings-inline-alert info"><Icon name="info" /><div><strong>Data log masih berupa mock</strong><p>Audit log server-side baru akan tersedia setelah integrasi backend.</p></div></section>

      {selectedLog && (
        <SettingsModal description={`ID Aktivitas: ${selectedLog.id}`} onClose={() => setSelectedLog(null)} title="Detail Aktivitas">
          <div className="settings-activity-detail">
            <dl><div><dt>Waktu</dt><dd>{selectedLog.timestamp}</dd></div><div><dt>Pengguna</dt><dd>{selectedLog.user}</dd></div><div><dt>Role</dt><dd>{selectedLog.role}</dd></div><div><dt>Modul</dt><dd>{selectedLog.module}</dd></div><div><dt>Aktivitas</dt><dd>{selectedLog.activity}</dd></div><div><dt>Target</dt><dd>{selectedLog.target}</dd></div><div><dt>Status</dt><dd><span className={`settings-status-badge ${selectedLog.status === 'Berhasil' ? 'success' : selectedLog.status === 'Menunggu' ? 'pending' : 'muted'}`}>{selectedLog.status}</span></dd></div></dl>
            <div className="settings-detail-note"><strong>Rincian</strong><p>{selectedLog.detail}</p></div>
          </div>
          <footer className="settings-modal-actions"><Button className="settings-primary-button" onClick={() => setSelectedLog(null)}>Tutup</Button></footer>
        </SettingsModal>
      )}
    </div>
  )
}
