import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'

const EMPTY_FORM = {
  date: '2025-05-09',
  academicYear: '2024/2025',
  semester: 'Genap',
  className: 'X Merdeka 3',
  subject: 'Matematika',
  teacher: 'Budi Santoso',
  time: '07:00 - 07:45',
  meeting: 1,
  material: '',
  chapter: '',
  activities: '',
  method: 'Diskusi',
  media: 'PPT',
  notes: '',
  attendancePresent: 22,
  attendanceTotal: 25,
  status: 'Lengkap',
}

function normalizeActivities(value) {
  if (Array.isArray(value)) return value.join('\n')
  return String(value ?? '')
}

function formFromRecord(record = {}) {
  return {
    ...EMPTY_FORM,
    ...record,
    meeting: record.meeting ?? record.meetingNumber ?? record.sequence ?? EMPTY_FORM.meeting,
    material: record.material ?? record.materialTitle ?? EMPTY_FORM.material,
    activities: normalizeActivities(record.activities ?? record.activity ?? record.learningActivities),
    method: record.method ?? record.learningMethod ?? EMPTY_FORM.method,
    media: record.media ?? record.learningMedia ?? EMPTY_FORM.media,
    notes: record.notes ?? record.note ?? EMPTY_FORM.notes,
    attendancePresent: record.attendancePresent ?? record.present ?? EMPTY_FORM.attendancePresent,
    attendanceTotal: record.attendanceTotal ?? record.totalStudents ?? EMPTY_FORM.attendanceTotal,
  }
}

function Field({ children, error, label, required }) {
  return (
    <label className={`journal-form-field${error ? ' has-error' : ''}`}>
      <span>{label}{required && <i aria-hidden="true">*</i>}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}

function SelectField({ error, label, name, onChange, options = [], required, value }) {
  return (
    <Field error={error} label={label} required={required}>
      <select name={name} onChange={onChange} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  )
}

function journalIdentity(record) {
  return [record.date, record.teacher, record.className, record.subject, record.time]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .join('|')
}

export function JournalFormModal({
  initialData,
  journals = [],
  mode = 'add',
  onClose,
  onOpenDuplicate,
  onSave,
  options = {},
}) {
  const [form, setForm] = useState(() => formFromRecord(initialData))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [duplicate, setDuplicate] = useState(null)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef(null)
  const saveTimerRef = useRef(null)
  const closeHandlerRef = useRef(onClose)

  const lists = useMemo(() => ({
    academicYears: options.academicYears ?? ['2024/2025'],
    semesters: options.semesters ?? ['Genap', 'Ganjil'],
    classes: options.classes ?? ['X Merdeka 3'],
    subjects: options.subjects ?? ['Matematika'],
    teachers: options.teachers ?? ['Budi Santoso'],
    timeSlots: options.timeSlots ?? ['07:00 - 07:45'],
    methods: options.methods ?? ['Ceramah', 'Diskusi', 'Tanya Jawab', 'Praktikum'],
    media: options.media ?? ['PPT', 'LKS', 'Whiteboard', 'Video'],
  }), [options])

  const requestClose = () => {
    if (dirty && !confirmClose) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  useEffect(() => {
    dialogRef.current?.focus()
    return () => window.clearTimeout(saveTimerRef.current)
  }, [])

  useEffect(() => {
    closeHandlerRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (dirty && !confirmClose) setConfirmClose(true)
      else closeHandlerRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmClose, dirty])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setDuplicate(null)
    setConfirmClose(false)
    setDirty(true)
  }

  const validate = () => {
    const nextErrors = {}
    const requiredFields = {
      date: 'Tanggal wajib diisi.',
      className: 'Pilih kelas pembelajaran.',
      subject: 'Pilih mata pelajaran.',
      teacher: 'Pilih guru pengampu.',
      time: 'Pilih jam pelajaran.',
      meeting: 'Pertemuan wajib diisi.',
      material: 'Materi pembelajaran wajib diisi.',
      activities: 'Kegiatan pembelajaran wajib diisi.',
    }
    Object.entries(requiredFields).forEach(([key, message]) => {
      if (!String(form[key] ?? '').trim()) nextErrors[key] = message
    })
    if (Number(form.meeting) < 1) nextErrors.meeting = 'Pertemuan minimal bernilai 1.'
    if (Number(form.attendancePresent) > Number(form.attendanceTotal)) {
      nextErrors.attendancePresent = 'Jumlah hadir tidak boleh melebihi total siswa.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate() || saving) return

    const matchedJournal = journals.find((journal) => (
      journal.id !== initialData?.id && journalIdentity(journal) === journalIdentity(form)
    ))
    if (matchedJournal) {
      setDuplicate(matchedJournal)
      return
    }

    setSaving(true)
    saveTimerRef.current = window.setTimeout(() => {
      onSave({
        ...initialData,
        ...form,
        meeting: Number(form.meeting),
        attendancePresent: Number(form.attendancePresent),
        attendanceTotal: Number(form.attendanceTotal),
        present: Number(form.attendancePresent),
        totalStudents: Number(form.attendanceTotal),
        activities: form.activities.split('\n').map((item) => item.trim()).filter(Boolean),
      })
    }, 350)
  }

  return (
    <div className="journal-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }} role="presentation">
      <section
        aria-labelledby="journal-form-title"
        aria-modal="true"
        className="journal-modal journal-form-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="journal-modal-header">
          <div>
            <small>{mode === 'edit' ? 'Perbarui aktivitas pembelajaran' : 'Catat pertemuan baru'}</small>
            <h2 id="journal-form-title">{mode === 'edit' ? 'Edit Jurnal Mengajar' : 'Tambah Jurnal Mengajar'}</h2>
            <p>Konteks pembelajaran mengikuti penugasan guru dan jadwal Akademik.</p>
          </div>
          <button aria-label="Tutup form jurnal" onClick={requestClose} type="button">&times;</button>
        </header>

        <form onSubmit={submit}>
          <div className="journal-form-scroll">
            <section className="journal-form-section">
              <header><span><Icon name="calendar" /></span><div><h3>Konteks Pertemuan</h3><p>Pilih jadwal yang sesuai dengan kegiatan mengajar.</p></div></header>
              <div className="journal-form-grid journal-form-grid-three">
                <Field error={errors.date} label="Tanggal" required>
                  <input name="date" onChange={updateField} type="date" value={form.date} />
                </Field>
                <SelectField error={errors.academicYear} label="Tahun Ajaran" name="academicYear" onChange={updateField} options={lists.academicYears} value={form.academicYear} />
                <SelectField error={errors.semester} label="Semester" name="semester" onChange={updateField} options={lists.semesters} value={form.semester} />
                <SelectField error={errors.className} label="Kelas" name="className" onChange={updateField} options={lists.classes} required value={form.className} />
                <SelectField error={errors.subject} label="Mata Pelajaran" name="subject" onChange={updateField} options={lists.subjects} required value={form.subject} />
                <SelectField error={errors.teacher} label="Guru" name="teacher" onChange={updateField} options={lists.teachers} required value={form.teacher} />
                <SelectField error={errors.time} label="Jam Pelajaran" name="time" onChange={updateField} options={lists.timeSlots} required value={form.time} />
                <Field error={errors.meeting} label="Pertemuan Ke" required>
                  <input min="1" name="meeting" onChange={updateField} type="number" value={form.meeting} />
                </Field>
                <Field error={errors.chapter} label="Bab / Topik">
                  <input name="chapter" onChange={updateField} placeholder="Contoh: Bab 1" value={form.chapter} />
                </Field>
              </div>
            </section>

            <section className="journal-form-section">
              <header><span><Icon name="book" /></span><div><h3>Aktivitas Pembelajaran</h3><p>Catat materi dan kegiatan utama pada pertemuan ini.</p></div></header>
              <div className="journal-form-grid">
                <Field error={errors.material} label="Materi Pembelajaran" required>
                  <input name="material" onChange={updateField} placeholder="Masukkan materi yang disampaikan" value={form.material} />
                </Field>
                <SelectField label="Metode Pembelajaran" name="method" onChange={updateField} options={lists.methods} value={form.method} />
                <Field error={errors.activities} label="Kegiatan Pembelajaran" required>
                  <textarea name="activities" onChange={updateField} placeholder={'Tuliskan satu kegiatan per baris\nContoh: Apersepsi\nPenjelasan konsep'} rows="5" value={form.activities} />
                </Field>
                <div className="journal-form-stack">
                  <SelectField label="Media Pembelajaran" name="media" onChange={updateField} options={lists.media} value={form.media} />
                  <Field error={errors.notes} label="Catatan Guru">
                    <textarea name="notes" onChange={updateField} placeholder="Catatan tambahan (opsional)" rows="3" value={form.notes} />
                  </Field>
                </div>
              </div>
            </section>

            <section className="journal-form-section journal-attendance-section">
              <header><span><Icon name="users" /></span><div><h3>Informasi Kehadiran</h3><p>Hanya ringkasan; perubahan detail dilakukan melalui modul Absensi.</p></div></header>
              <div className="journal-attendance-fields">
                <Field error={errors.attendancePresent} label="Siswa Hadir">
                  <input min="0" name="attendancePresent" onChange={updateField} type="number" value={form.attendancePresent} />
                </Field>
                <Field label="Total Siswa">
                  <input min="1" name="attendanceTotal" onChange={updateField} type="number" value={form.attendanceTotal} />
                </Field>
                <div className="journal-attendance-preview">
                  <span>Persentase</span>
                  <strong>{Number(form.attendanceTotal) > 0 ? ((Number(form.attendancePresent) / Number(form.attendanceTotal)) * 100).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}%</strong>
                </div>
              </div>
            </section>

            {duplicate && (
              <div className="journal-duplicate-alert" role="alert">
                <Icon name="info" />
                <div><strong>Jurnal untuk jadwal ini sudah tersedia.</strong><span>Gunakan jurnal yang sudah ada agar satu pertemuan tidak tercatat dua kali.</span></div>
                {onOpenDuplicate && <button onClick={() => onOpenDuplicate(duplicate)} type="button">Lihat Jurnal</button>}
              </div>
            )}

            {confirmClose && (
              <div className="journal-unsaved-alert" role="alert">
                <Icon name="info" />
                <div><strong>Perubahan belum disimpan.</strong><span>Klik “Tetap Tutup” jika perubahan boleh dibuang.</span></div>
              </div>
            )}
          </div>

          <footer className="journal-modal-footer">
            <span className={`journal-dirty-indicator${dirty ? ' active' : ''}`}><i />{dirty ? 'Perubahan belum disimpan' : 'Belum ada perubahan'}</span>
            <div>
              <Button className="journal-button journal-button-secondary" onClick={requestClose}>{confirmClose ? 'Tetap Tutup' : 'Batal'}</Button>
              <Button className="journal-button journal-button-primary" disabled={saving} type="submit"><Icon name="save" />{saving ? 'Menyimpan...' : 'Simpan Jurnal'}</Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}

function DetailItem({ label, value }) {
  return <div><span>{label}</span><strong>{value || '-'}</strong></div>
}

export function JournalDetailModal({ journal, onClose, onEdit }) {
  const dialogRef = useRef(null)
  const closeHandlerRef = useRef(onClose)
  const activities = Array.isArray(journal.activities)
    ? journal.activities
    : String(journal.activities ?? journal.activity ?? '').split('\n').filter(Boolean)
  const present = journal.attendancePresent ?? journal.present ?? 0
  const total = journal.attendanceTotal ?? journal.totalStudents ?? 0

  useEffect(() => {
    closeHandlerRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && closeHandlerRef.current()
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="journal-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
      <section aria-labelledby="journal-detail-title" aria-modal="true" className="journal-modal journal-detail-modal" ref={dialogRef} role="dialog" tabIndex="-1">
        <header className="journal-modal-header">
          <div><small>Detail Jurnal Mengajar</small><h2 id="journal-detail-title">{journal.subject}</h2><p>{journal.className} &middot; {journal.teacher}</p></div>
          <button aria-label="Tutup detail jurnal" onClick={onClose} type="button">&times;</button>
        </header>
        <div className="journal-detail-scroll">
          <div className="journal-detail-context">
            <DetailItem label="Tanggal" value={journal.dateLabel ?? journal.formattedDate ?? journal.date} />
            <DetailItem label="Jam" value={journal.time} />
            <DetailItem label="Pertemuan" value={`Ke-${journal.meeting ?? journal.meetingNumber ?? '-'}`} />
            <DetailItem label="Kehadiran" value={`${present} / ${total} siswa`} />
          </div>
          <section className="journal-detail-section"><span>Materi Pembelajaran</span><h3>{journal.material ?? journal.materialTitle}</h3><small>{journal.chapter ?? ''}</small></section>
          <section className="journal-detail-section"><span>Kegiatan Pembelajaran</span><ul>{activities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section>
          <div className="journal-detail-tags">
            <DetailItem label="Metode" value={journal.method ?? journal.learningMethod} />
            <DetailItem label="Media" value={journal.media ?? journal.learningMedia} />
            <DetailItem label="Status" value={journal.status} />
          </div>
          <section className="journal-detail-note"><Icon name="clipboard" /><div><span>Catatan Guru</span><p>{journal.notes ?? journal.note ?? 'Tidak ada catatan tambahan.'}</p></div></section>
        </div>
        <footer className="journal-modal-footer">
          <span />
          <div><Button className="journal-button journal-button-secondary" onClick={onClose}>Tutup</Button><Button className="journal-button journal-button-primary" onClick={() => onEdit(journal)}><Icon name="edit" />Edit Jurnal</Button></div>
        </footer>
      </section>
    </div>
  )
}
