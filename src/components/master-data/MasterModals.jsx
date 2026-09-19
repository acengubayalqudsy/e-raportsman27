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
  const sections = [...new Set(fields.map((field) => field.section ?? 'Informasi Utama'))]

  const submit = (event) => {
    event.preventDefault()
    onSave(formData)
  }

  return (
    <MasterModalFrame description="Data hanya disimpan pada local state selama tahap frontend." onClose={onClose} size={fields.length > 7 ? 'large' : 'regular'} title={`${mode === 'edit' ? 'Edit' : 'Tambah'} ${entityLabel}`}>
      <form className="master-entity-form" onSubmit={submit}>
        <div className="master-form-scroll">
          {sections.map((section) => (
            <fieldset key={section}>
              <legend>{section}</legend>
              <div className="master-form-grid">
                {fields.filter((field) => (field.section ?? 'Informasi Utama') === section).map((field) => (
                  <label className={field.fullWidth ? 'full-width' : ''} key={field.key}>
                    <span>{field.label}{field.required && <b>*</b>}</span>
                    {field.type === 'select' ? (
                      <select required={field.required} value={formData[field.key]} onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}>
                        <option value="">Pilih {field.label}</option>
                        {(field.options ?? []).map((option) => {
                          const value = typeof option === 'string' ? option : option.value
                          const label = typeof option === 'string' ? option : option.label
                          return <option key={value} value={value}>{label}</option>
                        })}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea required={field.required} value={formData[field.key]} onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))} />
                    ) : (
                      <input required={field.required} type={field.type ?? 'text'} value={formData[field.key]} onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))} />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <footer><Button className="master-button secondary" onClick={onClose}>Batal</Button><Button className="master-button primary" type="submit"><Icon name="save" />Simpan Data</Button></footer>
      </form>
    </MasterModalFrame>
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
