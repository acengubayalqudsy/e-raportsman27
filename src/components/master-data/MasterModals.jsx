import { useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'

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
  const [formData, setFormData] = useState(() => Object.fromEntries(fields.map((field) => [field.key, initialData[field.key] ?? field.defaultValue ?? ''])))
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const sections = [...new Set(fields.map((field) => field.section ?? 'Informasi Utama'))]

  const handleChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }))
    if (errorMessage) setErrorMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
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
      description={mode === 'edit' ? 'Perbarui informasi siswa pada database sekolah.' : 'Lengkapi formulir untuk menambahkan data siswa ke sistem.'}
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
                {fields.filter((field) => (field.section ?? 'Informasi Utama') === section).map((field) => (
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
  if (!item) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(item)
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
            <p>Data {entityLabel} akan diarsipkan (soft delete) dari sistem.</p>
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
            ) : (
              <p>
                Kode/Identitas: <strong>{item.code || item.name || '-'}</strong> {item.grade ? `| Tingkat: ${item.grade}` : ''}
              </p>
            )}
            <small>Apakah Anda yakin ingin menghapus data {entityLabel} ini dari daftar aktif?</small>
          </div>
        </div>

        <footer className="master-modal-footer">
          <Button className="master-button secondary" disabled={isDeleting} onClick={onClose} type="button">Batal</Button>
          <Button className="master-button danger" disabled={isDeleting} onClick={handleConfirm} type="button">
            <Icon name="trash" />{isDeleting ? 'Menghapus...' : `Ya, Hapus ${entityLabel}`}
          </Button>
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

export function MasterImportModal({ entityLabel, onClose, onComplete }) {
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const importData = () => {
    setIsImporting(true)
    window.setTimeout(() => {
      setIsImporting(false)
      onComplete(fileName)
    }, 650)
  }

  return (
    <MasterModalFrame description="Simulasi import frontend tanpa membaca atau mengunggah workbook." onClose={onClose} title={`Import Data ${entityLabel}`}>
      <div className="master-import-body">
        <label className="master-file-drop">
          <Icon name="download" />
          <strong>{fileName || 'Pilih file Excel'}</strong>
          <span>Format yang didukung: .xlsx atau .xls</span>
          <input accept=".xlsx,.xls" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} type="file" />
        </label>
        <button className="master-template-link" type="button"><Icon name="download" />Unduh Template {entityLabel}</button>
      </div>
      <footer className="master-modal-footer"><Button className="master-button secondary" disabled={isImporting} onClick={onClose}>Batal</Button><Button className="master-button primary" disabled={!fileName || isImporting} onClick={importData}>{isImporting ? <span className="master-spinner" /> : <Icon name="download" />}{isImporting ? 'Mengimpor...' : 'Import Data'}</Button></footer>
    </MasterModalFrame>
  )
}
