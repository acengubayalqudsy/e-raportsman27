import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import tutWuriLogo from '../../assets/logo/tut-wuri-handayani-monochrome.jpg'
import { raporDocumentTypes } from '../../data/rapor.js'
import studentService from '../../services/studentService.js'
import assessmentService from '../../services/assessmentService.js'
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
  const [studentId, setStudentId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedClassObj, setSelectedClassObj] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const school = getCurrentSchoolIdentity()
  const reportCity = String(school.city ?? 'Garut').replace(/^(Kabupaten|Kota)\s+/i, '').trim() || 'Garut'
  const reportDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  const handleOptionsReady = (state) => {
    setSelectedClassObj(state.selectedClass)
    if (state.classId && state.classId !== selectedClassId) {
      setSelectedClassId(String(state.classId))
    }
    const classStudents = state.classData?.students || []
    if (classStudents.length > 0) {
      if (!studentId || !classStudents.some((s) => String(s.student_id) === String(studentId))) {
        setStudentId(String(classStudents[0].student_id))
      }
    }
  }

  useEffect(() => {
    if (!studentId) return undefined
    let active = true
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const result = await studentService.getStudentById(studentId)
      if (!active) return
      setStudent(result.success ? result.data : null)
      setError(result.success ? '' : result.error)
      setLoading(false)
    }, 0)
    return () => { active = false; window.clearTimeout(timer) }
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
      <RaporContextFilters
        authoritative
        allowClassSelection
        includeStudent
        values={{ className: selectedClassId, studentId }}
        onChange={(key, value) => {
          if (key === 'className') {
            setSelectedClassId(value)
            setStudentId('')
          }
          if (key === 'studentId') {
            setStudentId(value)
          }
        }}
        onOptionsReady={handleOptionsReady}
      />
      {loading && <p role="status">Memuat data siswa dari server...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !student && <p role="status">Belum ada siswa aktif yang dapat dipilih.</p>}
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
            <div><dt>Kelas</dt><dd>{showValue(student?.class_name || selectedClassObj?.label)}</dd></div>
            <div><dt>Tahun Ajaran</dt><dd>{showValue(selectedClassObj?.academicYearName || selectedYear?.name)}</dd></div>
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
  const navigate = useNavigate()
  const { selectedSemester } = useAcademicContext()
  const [documentType, setDocumentType] = useState(raporDocumentTypes[0])
  const [students, setStudents] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleOptionsReady = (state) => {
    setContext(state.context)
    if (state.classId && state.classId !== selectedClassId) {
      setSelectedClassId(String(state.classId))
    }
    if (state.semesterId && state.semesterId !== selectedSemesterId) {
      setSelectedSemesterId(String(state.semesterId))
    }
  }

  const effectiveClassId = selectedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const effectiveSemesterId = selectedSemesterId || context?.active_semester?.id || context?.assigned_courses?.[0]?.semester_id || selectedSemester?.id

  useEffect(() => {
    let active = true
    async function loadStudents() {
      setLoading(true)
      if (effectiveClassId && effectiveSemesterId) {
        const recapRes = await assessmentService.getClassRecap(effectiveClassId, effectiveSemesterId)
        if (!active) return
        if (recapRes.success && recapRes.data?.students?.length) {
          const list = recapRes.data.students.map((s) => ({
            id: s.student_id,
            name: s.name,
            nis: s.nis,
          }))
          setStudents(list)
          setSelectedIds(new Set(list.map((s) => s.id)))
          setLoading(false)
          return
        }
      }

      const res = await studentService.getStudents({ status: 'Aktif', per_page: 50 })
      if (!active) return
      if (res.success && res.data) {
        const list = res.data.map((s) => ({
          id: s.id,
          name: s.name,
          nis: s.nis,
        }))
        setStudents(list)
        setSelectedIds(new Set(list.map((s) => s.id)))
      }
      setLoading(false)
    }
    loadStudents()
    return () => { active = false }
  }, [effectiveClassId, effectiveSemesterId])

  const allSelected = students.length > 0 && selectedIds.size === students.length

  const toggleStudent = (studentId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(students.map((s) => s.id)))
  }

  const handlePreview = () => {
    const firstId = Array.from(selectedIds)[0]
    if (documentType.toLowerCase().includes('cover') || documentType.toLowerCase().includes('identitas')) {
      navigate('/rapor-leger/cover-rapor')
    } else if (firstId) {
      navigate(`/rapor-leger/rapor-per-siswa?student_id=${firstId}`)
    } else {
      navigate('/rapor-leger/rapor-per-siswa')
    }
  }

  const handlePrint = () => {
    window.print()
    onNotify?.(`Membuka dialog cetak untuk ${selectedIds.size} siswa terpilih.`)
  }

  const handleExportPdf = () => {
    onNotify?.(`Menyiapkan ${selectedIds.size} berkas PDF (${documentType}). Silakan simpan melalui dialog cetak atau unduhan browser.`)
    window.print()
  }

  const handleExportWord = () => {
    onNotify?.(`Mengekspor ${selectedIds.size} berkas Word (.docx) untuk ${documentType}...`)
  }

  const currentClassName = context?.homeroom_classes?.find((c) => String(c.class_id || c.id) === String(effectiveClassId))?.class_name
    || context?.homeroom_class?.class_name
    || context?.assigned_courses?.find((c) => String(c.class_id) === String(effectiveClassId))?.class_name
    || 'Kelas Terpilih'
  const currentSemesterName = context?.active_semester?.name || selectedSemester?.name || 'Semester Aktif'

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters
        authoritative
        allowClassSelection
        includeDocument
        values={{ documentType, className: selectedClassId, semester: selectedSemesterId }}
        onChange={(key, value) => {
          if (key === 'documentType') setDocumentType(value)
          if (key === 'className') setSelectedClassId(value)
          if (key === 'semester') setSelectedSemesterId(value)
        }}
        onOptionsReady={handleOptionsReady}
      />
      <div className="report-export-layout">
        <section className="report-panel">
          <div className="report-section-heading">
            <div>
              <span><Icon name="users" /></span>
              <div>
                <h3>Pilih Siswa</h3>
                <p>Tentukan siswa yang akan dimasukkan ke dalam dokumen.</p>
              </div>
            </div>
            <small>{selectedIds.size} siswa dipilih</small>
          </div>
          <label className="report-select-all">
            <input checked={allSelected} onChange={toggleAll} type="checkbox" />
            <span>
              <strong>Pilih Semua Siswa</strong>
              <small>{students.length} siswa {currentClassName}</small>
            </span>
          </label>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat data siswa...</p>
          ) : (
            <div className="report-student-checklist">
              {students.map((student) => (
                <label key={student.id}>
                  <input
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    type="checkbox"
                  />
                  <span>
                    {student.name}
                    <small>{student.nis}</small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <aside className="report-export-card">
          <span className="report-export-icon"><Icon name="document" /></span>
          <h3>Persiapan Dokumen</h3>
          <p>Periksa pilihan sebelum melakukan preview, cetak, atau export.</p>
          <dl>
            <div><dt>Jenis Dokumen</dt><dd>{documentType}</dd></div>
            <div><dt>Kelas</dt><dd>{currentClassName}</dd></div>
            <div><dt>Siswa Dipilih</dt><dd>{selectedIds.size} siswa</dd></div>
            <div><dt>Semester</dt><dd>{currentSemesterName}</dd></div>
          </dl>
          {selectedIds.size === 0 && (
            <p className="report-generate-warning"><Icon name="info" />Pilih minimal satu siswa untuk melanjutkan.</p>
          )}
          <div className="report-export-actions">
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={handlePreview}><Icon name="eye" />Preview</Button>
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={handlePrint}><Icon name="printer" />Cetak</Button>
            <Button className="report-button primary" disabled={selectedIds.size === 0} onClick={handleExportPdf}><Icon name="download" />Export PDF</Button>
            <Button className="report-button report-button-word" disabled={selectedIds.size === 0} onClick={handleExportWord}><Icon name="fileWord" />Export Word</Button>
          </div>
          <small>Pilih aksi preview, cetak langsung, atau unduh berkas PDF/Word.</small>
        </aside>
      </div>
    </section>
  )
}
