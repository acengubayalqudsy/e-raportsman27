import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import tutWuriLogo from '../../assets/logo/tut-wuri-handayani-monochrome.jpg'
import { raporDocumentTypes, raporStudents } from '../../data/rapor.js'
import studentService from '../../services/studentService.js'
import { getCurrentSchoolIdentity } from '../../services/schoolIdentitySession.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import RaporContextFilters from './RaporContextFilters.jsx'

const showValue = (value) => String(value ?? '').trim() || '–'
const showDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : '–'

function IdentityRow({ number, label, value, strong = false, heading = false, sub = false }) {
  return <div className={`report-identity-row${heading ? ' section-heading' : ''}${sub ? ' sub-row' : ''}`}><span>{number}</span><span>{label}</span><span>{heading ? '' : ':'}</span><span className={strong ? 'emphasis' : ''}>{heading ? '' : showValue(value)}</span></div>
}

export function CoverRaporView() {
  const { selectedYear } = useAcademicContext()
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')
  const [student, setStudent] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const school = getCurrentSchoolIdentity()
  const reportCity = String(school.city ?? 'Garut').replace(/^(Kabupaten|Kota)\s+/i, '').trim() || 'Garut'
  const reportDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      const result = await studentService.getStudents({ search: studentSearch, per_page: 100, status: 'Aktif' })
      if (!active) return
      setStudents(result.success ? result.data : [])
      setError(result.success ? '' : result.error)
      setLoading(false)
      if (result.success && result.data.length) setStudentId((current) => current || String(result.data[0].id))
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [studentSearch])

  useEffect(() => {
    if (!studentId) return undefined
    let active = true
    studentService.getStudentById(studentId).then((result) => {
      if (!active) return
      setStudent(result.success ? result.data : null)
      setError(result.success ? '' : result.error)
    })
    return () => { active = false }
  }, [studentId])

  const printable = Boolean(student && !error)
  const schoolRows = [
    ['Nama Sekolah', school.schoolName], ['NPSN', school.npsn], ['NSS', school.nss],
    ['Alamat Sekolah', school.address], ['Kode Pos', school.postalCode], ['Telepon', school.phone],
    ['Desa/Kelurahan', school.village], ['Kecamatan', school.district],
    ['Kabupaten/Kota', school.city], ['Provinsi', school.province],
    ['Website', school.website], ['E-mail', school.email],
  ]

  const handlePrint = () => {
    const originalTitle = document.title
    if (student?.name) {
      document.title = `Cover_Rapor_${String(student.name).trim().replace(/\s+/g, '_')}`
    }
    window.print()
    window.setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  return (
    <section className="report-secondary-workspace">
      <div className="report-context-filters fields-2">
        <label className="report-field"><span>Cari Siswa</span><input onChange={(event) => setStudentSearch(event.target.value)} placeholder="Nama, NIS, atau NISN" value={studentSearch} /></label>
        <label className="report-field"><span>Pilih Siswa</span><select onChange={(event) => setStudentId(event.target.value)} value={studentId}><option value="">Pilih siswa</option>{students.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.nis}</option>)}{student && !students.some((item) => String(item.id) === studentId) && <option value={studentId}>{student.name} — {student.nis}</option>}</select></label>
      </div>
      {loading && <p role="status">Memuat data siswa dari server...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !students.length && !student && <p role="status">Belum ada siswa aktif yang dapat dipilih.</p>}
      <div className="report-cover-layout">
        <aside className="report-cover-info">
          <div className="report-cover-info-header">
            <span><Icon name="report" /></span>
            <div>
              <h3>Preview Rapor</h3>
              <p>Tiga halaman awal mengikuti identitas sekolah dan biodata siswa dari Master Siswa.</p>
            </div>
          </div>
          <dl>
            <div><dt>Nama Siswa</dt><dd>{showValue(student?.name)}</dd></div>
            <div><dt>NISN</dt><dd>{showValue(student?.nisn)}</dd></div>
            <div><dt>Kelas</dt><dd>{showValue(student?.class_name)}</dd></div>
            <div><dt>Tahun Ajaran</dt><dd>{showValue(selectedYear?.name)}</dd></div>
          </dl>
          <div className="report-cover-actions">
            <Button className="report-button secondary" disabled={!printable} onClick={handlePrint}><Icon name="eye" />Preview Cetak</Button>
            <Button className="report-button primary" disabled={!printable} onClick={handlePrint}><Icon name="download" />Simpan sebagai PDF</Button>
          </div>
          <small className="report-print-tip">Format A4 standar 3 halaman siap cetak/simpan PDF tanpa URL browser.</small>
        </aside>

        <div className="report-cover-pages">
        <article className="report-cover-paper">
          <div className="report-cover-ministry-crest">
            <img src={tutWuriLogo} alt="Logo Tut Wuri Handayani" />
          </div>
          <div className="report-cover-heading">
            <strong>RAPOR<br />SEKOLAH MENENGAH ATAS<br />( S M A )</strong>
          </div>
          <div className="report-cover-crest">
            <img src={sman27Logo} alt="Logo SMAN 27 Garut" />
          </div>
          <h3>{showValue(school.schoolName)}</h3>
          <div className="report-cover-student">
            <span>Nama Peserta Didik</span>
            <strong className="report-cover-student-name">{showValue(student?.name)}</strong>
            <strong className="report-cover-student-nisn"><span>NISN</span><span>:</span><span>{showValue(student?.nisn)}</span></strong>
          </div>
          <footer>KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN<br />REPUBLIK INDONESIA</footer>
        </article>
        <article className="report-cover-paper report-identity-paper report-school-paper">
          <header>RAPOR<small>SEKOLAH MENENGAH ATAS<br />( SMA )</small></header>
          <div className="report-school-identity-table">
            {schoolRows.map(([label, value]) => <IdentityRow key={label} label={label} strong={label === 'Nama Sekolah'} value={value} />)}
          </div>
        </article>
        <article className="report-cover-paper report-identity-paper report-student-paper">
          <header>IDENTITAS PESERTA DIDIK</header>
          <div className="report-student-identity-table">
            <IdentityRow number="1" label="Nama Lengkap Peserta Didik" strong value={student?.name} />
            <IdentityRow number="2" label="NIS / NISN" value={student ? `${showValue(student.nis)} / ${showValue(student.nisn)}` : ''} />
            <IdentityRow number="3" label="Tempat, Tanggal Lahir" value={student ? `${showValue(student.birth_place)}, ${showDate(student.birth_date)}` : ''} />
            <IdentityRow number="4" label="Jenis Kelamin" value={student?.gender} />
            <IdentityRow number="5" label="Agama" value={student?.religion} />
            <IdentityRow number="6" label="Status dalam Keluarga" />
            <IdentityRow number="7" label="Anak ke" />
            <IdentityRow number="8" label="Alamat Peserta Didik" value={student?.address} />
            <IdentityRow number="9" label="Nomor Telepon" value={student?.phone} />
            <IdentityRow number="10" label="Sekolah Asal" value={student?.previous_school} />
            <IdentityRow heading number="11" label="Diterima di Sekolah ini" />
            <IdentityRow sub label="a.  Di kelas" value={student?.accepted_class} />
            <IdentityRow sub label="b.  Pada Tanggal" value={showDate(student?.admission_date)} />
            <IdentityRow heading number="12" label="Orang Tua" />
            <IdentityRow sub label="a.  Nama Ayah" value={student?.father_name} />
            <IdentityRow sub label="b.  Nama Ibu" value={student?.mother_name} />
            <IdentityRow sub label="c.  Alamat" />
            <IdentityRow sub label="d.  Nomor Telepon / HP" value={student?.parent_phone} />
            <IdentityRow heading number="13" label="Pekerjaan Orang Tua" />
            <IdentityRow sub label="a.  Ayah" value={student?.father_occupation} />
            <IdentityRow sub label="b.  Ibu" value={student?.mother_occupation} />
            <IdentityRow heading number="14" label="Wali Peserta Didik" />
            <IdentityRow sub label="a.  Nama Wali" value={student?.guardian_name} />
            <IdentityRow sub label="b.  Nomor Telepon / HP" value={student?.guardian_phone} />
            <IdentityRow sub label="c.  Alamat" value={student?.guardian_address} />
            <IdentityRow sub label="d.  Pekerjaan" />
            <div className="report-student-identity-signature">
              <div className="report-student-photo">Pas Foto<br />3 × 4</div>
              <div className="report-student-signature-text">
                <span>{reportCity}, {reportDate}</span>
                <span>Kepala Sekolah,</span>
                <strong>{showValue(school.principal)}</strong>
                <span className="report-student-principal-nip">NIP. {school.principalNip || '198003042003122006'}</span>
              </div>
            </div>
          </div>
        </article>
        </div>
      </div>
    </section>
  )
}

export function ExportRaporView({ onNotify }) {
  const [documentType, setDocumentType] = useState(raporDocumentTypes[0])
  const [selectedIds, setSelectedIds] = useState(() => new Set(raporStudents.slice(0, 2).map((student) => student.id)))
  const allSelected = selectedIds.size === raporStudents.length

  const toggleStudent = (studentId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(raporStudents.map((student) => student.id)))
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters includeDocument values={{ documentType }} onChange={(key, value) => { if (key === 'documentType') setDocumentType(value) }} />
      <div className="report-export-layout">
        <section className="report-panel">
          <div className="report-section-heading"><div><span><Icon name="users" /></span><div><h3>Pilih Siswa</h3><p>Tentukan siswa yang akan dimasukkan ke dalam dokumen.</p></div></div><small>{selectedIds.size} siswa dipilih</small></div>
          <label className="report-select-all"><input checked={allSelected} onChange={toggleAll} type="checkbox" /><span><strong>Pilih Semua Siswa</strong><small>36 siswa kelas X Merdeka 3</small></span></label>
          <div className="report-student-checklist">
            {raporStudents.map((student) => <label key={student.id}><input checked={selectedIds.has(student.id)} onChange={() => toggleStudent(student.id)} type="checkbox" /><span>{student.name}<small>{student.nis}</small></span></label>)}
          </div>
        </section>

        <aside className="report-export-card">
          <span className="report-export-icon"><Icon name="document" /></span><h3>Persiapan Dokumen</h3><p>Periksa pilihan sebelum melakukan preview, cetak, atau export.</p>
          <dl><div><dt>Jenis Dokumen</dt><dd>{documentType}</dd></div><div><dt>Kelas</dt><dd>X Merdeka 3</dd></div><div><dt>Siswa Dipilih</dt><dd>{selectedIds.size} siswa</dd></div><div><dt>Semester</dt><dd>Genap 2024/2025</dd></div></dl>
          {selectedIds.size === 0 && <p className="report-generate-warning"><Icon name="info" />Pilih minimal satu siswa untuk melanjutkan.</p>}
          <div className="report-export-actions">
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={() => onNotify(`Preview ${documentType} siap ditampilkan.`)}><Icon name="eye" />Preview</Button>
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={() => onNotify('Dokumen siap dikirim ke dialog cetak browser pada tahap integrasi.')}><Icon name="printer" />Cetak</Button>
            <Button className="report-button primary" disabled={selectedIds.size === 0} onClick={() => onNotify('Fitur export PDF akan diintegrasikan pada tahap berikutnya.')}><Icon name="download" />Export PDF</Button>
          </div>
          <small>Belum ada file PDF yang dibuat pada tahap frontend ini.</small>
        </aside>
      </div>
    </section>
  )
}
