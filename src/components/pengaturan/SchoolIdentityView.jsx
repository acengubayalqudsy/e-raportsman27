import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon.jsx'
import schoolLogo from '../../assets/logo/sman-27-garut-logo.png'

let identitySessionState = null

function IdentityField({ as = 'input', label, name, onChange, options, required, value, wide = false, ...props }) {
  const Element = as
  return (
    <label className={`settings-field ${wide ? 'settings-field-wide' : ''}`}>
      <span>{label}{required && <b aria-hidden="true">*</b>}</span>
      {as === 'select' ? (
        <select name={name} onChange={onChange} value={value} {...props}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <Element name={name} onChange={onChange} value={value} {...props} />
      )}
    </label>
  )
}

function SettingsAside({ onBackup }) {
  return (
    <aside className="settings-identity-aside">
      <section className="settings-side-card settings-system-information">
        <header><Icon name="info" /><h3>Informasi Sistem</h3></header>
        <dl>
          <div><dt>Versi Aplikasi</dt><dd>v1.0.0</dd></div>
          <div><dt>Environment</dt><dd>Frontend Prototype</dd></div>
          <div><dt>Framework</dt><dd>React</dd></div>
          <div><dt>Data</dt><dd>Mock / Local State</dd></div>
          <div><dt>Backend</dt><dd>Belum terintegrasi</dd></div>
          <div><dt>Database</dt><dd>Belum terintegrasi</dd></div>
        </dl>
      </section>

      <section className="settings-side-card settings-warning-card">
        <Icon name="info" />
        <div><h3>Perhatian</h3><p>Perubahan pengaturan dapat mempengaruhi tampilan dan konteks data akademik. Pastikan konfigurasi diperiksa sebelum disimpan.</p></div>
      </section>

      <section className="settings-side-card settings-tip-card">
        <Icon name="lightbulb" />
        <div>
          <h3>Tips</h3>
          <p>Pastikan Identitas Sekolah dan konfigurasi Rapor sudah diperiksa sebelum melakukan preview dokumen.</p>
          <button onClick={onBackup} type="button"><Icon name="cloudUpload" />Backup Sekarang</button>
        </div>
      </section>
    </aside>
  )
}

function SchoolIdentityView({ initialValue, onDirtyChange, onNotify, onOpenBackup }) {
  const sessionValue = identitySessionState?.value ?? initialValue
  const sessionLogo = identitySessionState?.logo ?? initialValue.logoUrl ?? schoolLogo
  const [savedValue, setSavedValue] = useState(() => ({ ...sessionValue }))
  const [draft, setDraft] = useState(() => ({ ...sessionValue }))
  const [savedLogoPreview, setSavedLogoPreview] = useState(sessionLogo)
  const [logoPreview, setLogoPreview] = useState(sessionLogo)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false)
  const fileRef = useRef(null)
  const saveTimerRef = useRef(null)
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedValue) || logoPreview !== savedLogoPreview

  useEffect(() => {
    onDirtyChange?.(isDirty)
    return () => onDirtyChange?.(false)
  }, [isDirty, onDirtyChange])

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), [])

  useEffect(() => {
    if (!showRemoveConfirmation) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowRemoveConfirmation(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [showRemoveConfirmation])

  const updateDraft = (event) => {
    if (isSaving) return
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleLogo = (event) => {
    if (isSaving) return
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Pilih file gambar berformat PNG atau JPG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran logo maksimal 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setLogoPreview(String(reader.result))
      setError('')
    }, { once: true })
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const requiredFields = ['schoolName', 'npsn', 'address', 'phone', 'email', 'principal']
    if (requiredFields.some((field) => !String(draft[field] ?? '').trim())) {
      setError('Lengkapi seluruh informasi wajib sebelum menyimpan.')
      return
    }
    setIsSaving(true)
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      const nextValue = { ...draft }
      identitySessionState = { value: nextValue, logo: logoPreview }
      setSavedValue(nextValue)
      setSavedLogoPreview(logoPreview)
      setIsSaving(false)
      onNotify('Identitas sekolah berhasil diperbarui.')
    }, 550)
  }

  return (
    <div className="settings-identity-layout">
      <form className="settings-form-card" onSubmit={handleSubmit}>
        <header className="settings-card-heading">
          <span><Icon name="building" /></span>
          <div><h3>Identitas Sekolah</h3><p>Informasi umum mengenai sekolah</p></div>
          {isDirty && <em>Perubahan belum disimpan</em>}
        </header>

        <div className="settings-identity-fields">
          <IdentityField label="Nama Sekolah" name="schoolName" onChange={updateDraft} required value={draft.schoolName} />
          <IdentityField label="NPSN" name="npsn" onChange={updateDraft} required value={draft.npsn} />
          <IdentityField as="textarea" label="Alamat" name="address" onChange={updateDraft} required rows={2} value={draft.address} />
          <IdentityField label="Kode Pos" name="postalCode" onChange={updateDraft} value={draft.postalCode} />
          <IdentityField label="Telepon" name="phone" onChange={updateDraft} required value={draft.phone} />
          <IdentityField label="Email" name="email" onChange={updateDraft} required type="email" value={draft.email} />
          <IdentityField label="Website" name="website" onChange={updateDraft} value={draft.website} />
          <IdentityField as="select" label="Kepala Sekolah" name="principal" onChange={updateDraft} options={['Drs. H. Ridwan Kamil, M.Pd.', 'Drs. Ahmad Saepudin, M.Pd.']} required value={draft.principal} />
        </div>

        <details className="settings-advanced-fields">
          <summary>Informasi identitas lanjutan</summary>
          <div className="settings-identity-fields">
            <IdentityField label="NSS" name="nss" onChange={updateDraft} value={draft.nss} />
            <IdentityField label="NIP Kepala Sekolah" name="principalNip" onChange={updateDraft} value={draft.principalNip} />
            <IdentityField label="Desa / Kelurahan" name="village" onChange={updateDraft} value={draft.village} />
            <IdentityField label="Kecamatan" name="district" onChange={updateDraft} value={draft.district} />
            <IdentityField label="Kabupaten / Kota" name="city" onChange={updateDraft} value={draft.city} />
            <IdentityField label="Provinsi" name="province" onChange={updateDraft} value={draft.province} />
          </div>
        </details>

        <section className="settings-logo-section">
          <span className="settings-logo-label">Logo Sekolah</span>
          <div className="settings-logo-content">
            <div className="settings-logo-preview">
              {logoPreview ? <img alt="Pratinjau logo sekolah" src={logoPreview} /> : <Icon name="image" />}
            </div>
            <div>
              <p>Format: PNG, JPG (Maks. 2MB)</p>
              <div className="settings-logo-actions">
                <input accept="image/png,image/jpeg" hidden onChange={handleLogo} ref={fileRef} type="file" />
                <button className="settings-button secondary" disabled={isSaving} onClick={() => fileRef.current?.click()} type="button"><Icon name="file" />Ubah Logo</button>
                <button className="settings-button danger" disabled={isSaving || !logoPreview} onClick={() => setShowRemoveConfirmation(true)} type="button"><Icon name="trash" />Hapus</button>
              </div>
            </div>
          </div>
        </section>

        {error && <p className="settings-form-error" role="alert"><Icon name="info" />{error}</p>}
        <footer className="settings-form-footer">
          <button className="settings-button primary" disabled={isSaving || !isDirty} type="submit"><Icon name="save" />{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </footer>
      </form>

      <SettingsAside onBackup={onOpenBackup} />

      {showRemoveConfirmation && (
        <div className="settings-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRemoveConfirmation(false) }} role="presentation">
          <section aria-labelledby="remove-logo-title" aria-modal="true" className="settings-confirm-modal" role="dialog">
            <header><span><Icon name="trash" /></span><div><h3 id="remove-logo-title">Hapus logo sekolah?</h3><p>Konfirmasi perubahan logo</p></div></header>
            <p>Logo hanya akan dihapus dari simulasi frontend. Anda dapat memilih logo baru sebelum menyimpan.</p>
            <footer><button autoFocus className="settings-button secondary" onClick={() => setShowRemoveConfirmation(false)} type="button">Batal</button><button className="settings-button danger solid" onClick={() => { setLogoPreview(''); setShowRemoveConfirmation(false) }} type="button">Hapus Logo</button></footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default SchoolIdentityView
