import { useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import excelService from '../../services/excelService.js'

function MasterModalFrame({ children, description, onClose, size = 'regular', title }) {
  return (
    <div className="master-modal-backdrop" role="presentation">
      <section aria-labelledby="master-modal-title" aria-modal="true" className={`master-modal ${size}`} role="dialog">
        <header>
          <div><h3 id="master-modal-title">{title}</h3>{description && <p>{description}</p>}</div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function MasterEntityModal({ entityLabel, fields, initialData = {}, mode = 'add', onClose, onSave }) {
  const [formData, setFormData] = useState(() => Object.fromEntries(fields.map((field) => [
    field.key, initialData[field.key] ?? field.defaultValue ?? (field.type === 'multiselect' ? [] : ''),
  ])))
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const sections = [...new Set(fields.map((field) => field.section ?? 'Informasi Utama'))]

  const handleChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }))
    if (errorMessage) setErrorMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    const missingGroup = fields.find((field) => field.required && field.type === 'multiselect' && !formData[field.key]?.length)
    if (missingGroup) {
      setErrorMessage(`Pilih minimal satu ${missingGroup.label.toLowerCase()}.`)
      return
    }
    setIsSubmitting(true)
    try {
      const result = await onSave(formData)
      if (result && result.success === false) {
        setErrorMessage(result.error || 'Terjadi kesalahan saat memvalidasi data.')
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MasterModalFrame
      description={mode === 'edit' ? `Perbarui informasi ${entityLabel.toLowerCase()} pada database sekolah.` : `Lengkapi formulir untuk menambahkan ${entityLabel.toLowerCase()} ke sistem.`}
      onClose={onClose}
      size={fields.length > 7 ? 'large' : 'regular'}
      title={`${mode === 'edit' ? 'Edit' : 'Tambah'} ${entityLabel}`}
    >
      <form className="master-entity-form" onSubmit={submit}>
        <div className="master-form-scroll">
          {errorMessage && (
            <div className="master-form-error-alert" role="alert">
              <Icon name="info" />
              <span>{errorMessage}</span>
            </div>
          )}
          {sections.map((section) => (
            <fieldset key={section}>
              <legend>{section}</legend>
              <div className="master-form-grid">
                {fields.filter((field) => (field.section ?? 'Informasi Utama') === section).map((field) => field.type === 'multiselect' ? (
                  <div className="master-form-multiselect full-width" key={field.key}>
                    <span>{field.label}{field.required && <b>*</b>}</span>
                    <div className="master-checkbox-options">
                      {(field.options ?? []).map((option) => {
                        const value = typeof option === 'string' ? option : option.value
                        const label = typeof option === 'string' ? option : option.label
                        return <label key={value}><input checked={(formData[field.key] || []).includes(value)} onChange={(event) => handleChange(field.key, event.target.checked ? [...(formData[field.key] || []), value] : (formData[field.key] || []).filter((item) => item !== value))} type="checkbox" /><span>{label}</span></label>
                      })}
                    </div>
                  </div>
                ) : field.type === 'password' ? (
                  <div className={`master-password-field${field.fullWidth ? ' full-width' : ''}`} key={field.key}>
                    <label htmlFor={`master-field-${field.key}`}>
                      {field.label}{field.required && <b>*</b>}
                    </label>
                    <div className="master-password-input">
                      <input
                        id={`master-field-${field.key}`}
                        onChange={(event) => handleChange(field.key, event.target.value)}
                        required={field.required}
                        type={visiblePasswords[field.key] ? 'text' : 'password'}
                        value={formData[field.key]}
                      />
                      <button
                        aria-label={visiblePasswords[field.key] ? 'Sembunyikan password' : 'Tampilkan password'}
                        aria-pressed={Boolean(visiblePasswords[field.key])}
                        onClick={() => setVisiblePasswords((current) => ({ ...current, [field.key]: !current[field.key] }))}
                        title={visiblePasswords[field.key] ? 'Sembunyikan password' : 'Tampilkan password'}
                        type="button"
                      >
                        <Icon name={visiblePasswords[field.key] ? 'eyeOff' : 'eye'} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={field.fullWidth ? 'full-width' : ''} key={field.key}>
                    <span>{field.label}{field.required && <b>*</b>}</span>
                    {field.type === 'select' ? (
                      <select required={field.required} value={formData[field.key]} onChange={(event) => handleChange(field.key, event.target.value)}>
                        <option value="">Pilih {field.label}</option>
                        {(field.options ?? []).map((option) => {
                          const value = typeof option === 'string' ? option : option.value
                          const label = typeof option === 'string' ? option : option.label
                          return <option key={value} value={value}>{label}</option>
                        })}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea required={field.required} value={formData[field.key]} onChange={(event) => handleChange(field.key, event.target.value)} />
                    ) : (
                      <input required={field.required} type={field.type ?? 'text'} value={formData[field.key]} onChange={(event) => handleChange(field.key, event.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <footer>
          <Button className="master-button secondary" disabled={isSubmitting} onClick={onClose} type="button">Batal</Button>
          <Button className="master-button primary" disabled={isSubmitting} type="submit">
            <Icon name="save" />{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </footer>
      </form>
    </MasterModalFrame>
  )
}

export function MasterDeleteModal({ entityLabel = 'Siswa', item, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  if (!item) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setErrorMessage('')
    try {
      const res = await onConfirm(item)
      if (res && res.success === false) {
        setErrorMessage(res.error || `Gagal menghapus data ${entityLabel}.`)
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="master-modal-backdrop" role="presentation">
      <section
        aria-labelledby="master-delete-title"
        aria-modal="true"
        className="master-modal master-confirmation"
        role="dialog"
      >
        <header>
          <div>
            <h3 id="master-delete-title">Hapus Data {entityLabel}?</h3>
            <p>Data {entityLabel} akan dihapus dari sistem master sekolah.</p>
          </div>
          <button aria-label="Tutup konfirmasi" disabled={isDeleting} onClick={onClose} type="button">&times;</button>
        </header>

        <div className="master-confirm-body danger">
          <span className="confirm-icon-danger"><Icon name="trash" /></span>
          <div>
            <h4>{item.name || item.code}</h4>
            {item.nis ? (
              <p>
                NIS: <strong>{item.nis || '-'}</strong> | NISN: <strong>{item.nisn || '-'}</strong> | Kelas: <strong>{item.className || '-'}</strong>
              </p>
            ) : item.nip ? (
              <p>
                NIP: <strong>{item.nip || '-'}</strong> | Mapel: <strong>{item.subject || '-'}</strong>
              </p>
            ) : item.room_type ? (
              <p>
                Kode: <strong>{item.code || '-'}</strong> | Tipe: <strong>{item.room_type}</strong> | Kapasitas: <strong>{item.capacity || 0} Siswa</strong>
              </p>
            ) : (
              <p>
                Kode/Identitas: <strong>{item.code || item.name || '-'}</strong> {item.grade ? `| Tingkat: ${item.grade}` : ''}
              </p>
            )}
            {errorMessage ? (
              <div className="master-form-error-alert" role="alert" style={{ marginTop: '12px', textAlign: 'left' }}>
                <Icon name="info" />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <small>Apakah Anda yakin ingin menghapus data {entityLabel} ini dari daftar aktif?</small>
            )}
          </div>
        </div>

        <footer className="master-modal-footer">
          <Button className="master-button secondary" disabled={isDeleting} onClick={onClose} type="button">Batal</Button>
          {!errorMessage && (
            <Button className="master-button danger" disabled={isDeleting} onClick={handleConfirm} type="button">
              <Icon name="trash" />{isDeleting ? 'Menghapus...' : `Ya, Hapus ${entityLabel}`}
            </Button>
          )}
        </footer>
      </section>
    </div>
  )
}

export function MasterDetailModal({ entityLabel, name, onClose, onEdit, sections }) {
  return (
    <MasterModalFrame description={name} onClose={onClose} size="large" title={`Detail ${entityLabel}`}>
      <div className="master-detail-body">
        <div className="master-detail-hero"><span>{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><strong>{name}</strong><small>Informasi lengkap data master</small></div></div>
        <div className="master-detail-sections">
          {sections.map((section) => <section key={section.title}><h4>{section.title}</h4><dl>{section.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value || '-'}</dd></div>)}</dl></section>)}
        </div>
      </div>
      <footer className="master-modal-footer"><Button className="master-button secondary" onClick={onClose}>Tutup</Button><Button className="master-button primary" onClick={onEdit}><Icon name="edit" />Edit Data</Button></footer>
    </MasterModalFrame>
  )
}

export function MasterImportModal({ entityLabel, module, context = {}, onClose, onComplete }) {
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('local')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [microsoft, setMicrosoft] = useState(null)
  const [folderId, setFolderId] = useState('')
  const [cloudFiles, setCloudFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [sheets, setSheets] = useState([])
  const [sheet, setSheet] = useState('')

  const run = async (operation) => {
    setBusy(true)
    setError('')
    try { return await operation() } catch (cause) { setError(cause.message); return null } finally { setBusy(false) }
  }
  const loadMicrosoft = () => run(async () => {
    const status = await excelService.microsoftStatus()
    setMicrosoft(status)
    if (status.connected) setCloudFiles(await excelService.microsoftFiles(folderId))
  })
  const selectCloudFile = (item) => run(async () => {
    if (item.folder) {
      setFolderId(item.id)
      setCloudFiles(await excelService.microsoftFiles(item.id))
      return
    }
    setSelectedFile(item)
    const available = await excelService.microsoftSheets(item.id)
    setSheets(available)
    setSheet(available[0]?.name || '')
  })
  const buildPreview = () => run(async () => {
    const result = source === 'local'
      ? await excelService.previewLocal(module, file, context)
      : await excelService.previewOneDrive(module, selectedFile.id, sheet, selectedFile.name, context)
    setPreview(result)
  })
  const commit = () => run(async () => {
    const result = await excelService.commit(module, preview.preview_id)
    onComplete(result.saved_count)
  })
  const errorReport = () => {
    const lines = [['Baris', 'Identifier', 'Status', 'Alasan'], ...preview.rows.map((row) => [row.row, row.identifier, row.status, row.reason])]
    const csv = '\uFEFF' + lines.map((line) => line.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-import-${module}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <MasterModalFrame description="Periksa hasil pencocokan sebelum menyimpan perubahan." onClose={onClose} size="large" title={`Import Excel ${entityLabel}`}>
      <div className="master-import-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Button className="master-button secondary" onClick={() => { setSource('local'); setPreview(null) }}>Import dari Perangkat</Button>
          <Button className="master-button secondary" onClick={() => { setSource('onedrive'); setPreview(null); loadMicrosoft() }}>Import dari Microsoft 365</Button>
          <button className="master-template-link" onClick={() => run(() => excelService.download(module, 'template', context))} type="button"><Icon name="download" />Download Template Excel</button>
        </div>
        {!preview && source === 'local' && <label className="master-file-drop"><Icon name="download" /><strong>{file?.name || 'Pilih file Excel'}</strong><span>Format .xlsx, maksimum 5 MB</span><input accept=".xlsx" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" /></label>}
        {!preview && source === 'onedrive' && <div>
          {!microsoft?.configured && <p>Microsoft 365 belum dikonfigurasi oleh administrator.</p>}
          {microsoft?.configured && !microsoft.connected && <Button className="master-button secondary" onClick={() => excelService.connectMicrosoft()}>Login Microsoft</Button>}
          {microsoft?.configured && <Button className="master-button secondary" onClick={loadMicrosoft}>Muat File OneDrive</Button>}
          {microsoft?.connected && <><div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {folderId && <button onClick={() => run(async () => { setFolderId(''); setCloudFiles(await excelService.microsoftFiles()) })} type="button">Kembali ke root</button>}
            {cloudFiles.map((item) => <button key={item.id} onClick={() => selectCloudFile(item)} style={{ display: 'block', padding: 6 }} type="button">{item.folder ? '📁 ' : '📄 '}{item.name}</button>)}
          </div>{selectedFile && <label>Worksheet <select onChange={(event) => setSheet(event.target.value)} value={sheet}>{sheets.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>}</>}
        </div>}
        {preview && <div>
          <p><strong>File:</strong> {preview.file} · <strong>Worksheet:</strong> {preview.sheet} · <strong>Modul:</strong> {entityLabel}</p>
          {Object.values(preview.context_labels || {}).some(Boolean) && <p>
            {preview.context_labels?.academic_year && <>TP: {preview.context_labels.academic_year} · </>}
            {preview.context_labels?.semester && <>Semester: {preview.context_labels.semester} · </>}
            {preview.context_labels?.class && <>Kelas: {preview.context_labels.class} · </>}
            {preview.context_labels?.subject && <>Mapel: {preview.context_labels.subject}</>}
          </p>}
          <p>{preview.total} baris terbaca · {preview.valid} valid · {preview.warnings} warning · {preview.errors} error</p>
          <button onClick={errorReport} type="button">Unduh Laporan Baris</button>
          <div style={{ maxHeight: 280, overflow: 'auto' }}><table><thead><tr><th>Baris</th><th>Identifier</th><th>Status</th><th>Alasan</th></tr></thead><tbody>
            {preview.rows.slice(0, 200).map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.identifier}</td><td>{row.status}</td><td>{row.reason}</td></tr>)}
          </tbody></table>{preview.rows.length > 200 && <p>Menampilkan 200 baris pertama. Unduh laporan untuk seluruh baris.</p>}</div>
        </div>}
        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      </div>
      <footer className="master-modal-footer"><Button className="master-button secondary" disabled={busy} onClick={onClose}>Batal</Button>
        {preview ? <Button className="master-button primary" disabled={busy || preview.errors > 0 || preview.total === 0} onClick={commit}>Konfirmasi dan Simpan</Button>
          : <Button className="master-button primary" disabled={busy || (source === 'local' ? !file : !selectedFile || !sheet)} onClick={buildPreview}>Tampilkan Preview</Button>}
      </footer>
    </MasterModalFrame>
  )
}
