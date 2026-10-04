import { useEffect, useRef, useState } from 'react'
import { initialSchoolIdentity } from '../../data/pengaturan.js'
import './StudentReportDocument.css'

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

const empty = (value) => {
  if (value == null) return '-'
  const str = String(value).trim()
  return str === '' ? '-' : str
}

const showScore = (value) => {
  if (value == null || value === '' || value === '-') return '-'
  const num = Number(value)
  return isNaN(num) ? '-' : num.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

function competencyText(row) {
  if (!row) return '-'
  const parts = [row.highest_achievement, row.lowest_achievement]
    .map((val) => String(val ?? '').trim())
    .filter((val) => val && val !== '-')
  return parts.length ? [...new Set(parts)].join('\n\n') : '-'
}

function createEmptyRow(num) {
  return {
    number: num,
    subject_id: `empty-${num}`,
    subject_name: '-',
    score: null,
    highest_achievement: '-',
    lowest_achievement: '-',
  }
}

/**
 * Builds the official 3-page document contract for SMAN 27 Garut.
 * Page 1: Academic rows 1–5 (guaranteed 5 rows)
 * Page 2: Academic rows 6–10 (guaranteed 5 rows)
 * Page 3: Academic row 11+ (guaranteed row 11 for West Java Mulok / reference match),
 *         followed by Kokurikuler, Ekstrakurikuler, Ketidakhadiran, Catatan, and Signatures.
 */
function buildDocumentPages(academicResults) {
  const list = Array.isArray(academicResults) ? academicResults : []

  // Page 1: Rows 1 to 5
  const firstPageRows = []
  for (let i = 1; i <= 5; i++) {
    if (list[i - 1]) {
      firstPageRows.push({ ...list[i - 1], number: i })
    } else {
      firstPageRows.push(createEmptyRow(i))
    }
  }

  // Page 2: Rows 6 to 10
  const secondPageRows = []
  for (let i = 6; i <= 10; i++) {
    if (list[i - 1]) {
      secondPageRows.push({ ...list[i - 1], number: i })
    } else {
      secondPageRows.push(createEmptyRow(i))
    }
  }

  // Page 3: Rows 11 and beyond
  const finalPageRows = []
  if (list.length > 10) {
    for (let i = 10; i < list.length; i++) {
      finalPageRows.push({ ...list[i], number: i + 1 })
    }
  } else {
    // SMAN 27 Garut reference document format includes subject 11 (Mulok Bahasa Sunda / row 11)
    finalPageRows.push(createEmptyRow(11))
  }

  return [
    { pageNumber: 1, rows: firstPageRows, isFinal: false },
    { pageNumber: 2, rows: secondPageRows, isFinal: false },
    { pageNumber: 3, rows: finalPageRows, isFinal: true },
  ]
}

function Identity({ student, school, phase }) {
  const nis = String(student?.nis ?? '').trim()
  const nisn = String(student?.nisn ?? '').trim()
  const nisDisplay = nis && nisn ? `${nis} / ${nisn}` : (nis || nisn || '-')

  const left = [
    ['Nama Peserta Didik', student?.name || '-'],
    ['NIS/NISN', nisDisplay],
    ['Nama Sekolah', school?.schoolName || school?.name || initialSchoolIdentity.schoolName || 'SMA Negeri 27 Garut'],
    ['Alamat', school?.address || initialSchoolIdentity.address || '-'],
  ]
  const right = [
    ['Kelas', student?.class_name || '-'],
    ['Fase', phase || 'E'],
    ['Semester', student?.semester_name || '-'],
    ['Tahun Ajaran', student?.academic_year_name || '-'],
  ]
  return (
    <div className="student-report-identity">
      {[left, right].map((group, groupIndex) => (
        <dl key={groupIndex}>
          {group.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <span>:</span>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  )
}

function AcademicTable({ rows, isCompact = false }) {
  return (
    <table className={`student-report-table student-report-grades ${isCompact ? 'student-report-academic-table-compact' : ''}`}>
      <colgroup>
        <col style={{ width: '8%' }} />
        <col style={{ width: '31%' }} />
        <col style={{ width: '13%' }} />
        <col style={{ width: '48%' }} />
      </colgroup>
      <thead>
        <tr>
          <th>No</th>
          <th>Mata Pelajaran</th>
          <th>Nilai<br />Akhir</th>
          <th>Capaian Kompetensi</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.subject_id ?? row.subject_name}-${row.number}`}>
            <td className="col-no">{row.number}</td>
            <td className="col-mapel">{row.subject_name ? empty(row.subject_name) : '-'}</td>
            <td className="col-nilai">{showScore(row.score)}</td>
            <td className="col-capaian">{competencyText(row)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Supplementary({ report, cocurriculars, homeroom, school, reportDate, city }) {
  const extracurriculars = report?.extracurriculars ?? []
  const attendance = report?.attendance

  // Authoritative homeroom resolution - never display UAT or dummy strings
  let homeroomTeacherName = homeroom?.teacher?.name
    || homeroom?.teacher_name
    || (typeof homeroom?.teacher === 'string' ? homeroom.teacher : null)
    || '-'
  let homeroomTeacherNip = homeroom?.teacher?.nip
    || homeroom?.teacher_nip
    || (typeof homeroom?.nip === 'string' ? homeroom.nip : null)
    || '-'

  if (/uat|test|dummy/i.test(homeroomTeacherName)) {
    homeroomTeacherName = '-'
    homeroomTeacherNip = '-'
  }

  // School principal resolution
  const principalName = school?.principal || initialSchoolIdentity.principal || '-'
  const principalNip = school?.principalNip || initialSchoolIdentity.principalNip || '-'

  // Build exactly 4 slots for Ekstrakurikuler matching reference document
  const defaultEkskulSlots = 4
  const ekskulRows = []
  for (let i = 0; i < defaultEkskulSlots; i++) {
    if (extracurriculars && extracurriculars[i]) {
      ekskulRows.push({
        number: i + 1,
        name: extracurriculars[i].name || extracurriculars[i].activity_name || '-',
        grade: extracurriculars[i].grade || extracurriculars[i].predicate || '-',
        description: extracurriculars[i].description || '-',
      })
    } else {
      ekskulRows.push({
        number: i + 1,
        name: '-',
        grade: '-',
        description: '-',
      })
    }
  }

  const cocurricularText = cocurriculars && cocurriculars.length
    ? cocurriculars.map((item) => item.description || item.title).filter(Boolean).join('\n\n') || '-'
    : (report?.cocurricular?.description || report?.cocurricular?.title || '-')

  return (
    <div className="student-report-supplementary">
      {/* 3. KOKURIKULER */}
      <section className="student-report-cocurricular-section">
        <div className="student-report-cocurricular-title">Kokurikuler</div>
        <div className="student-report-cocurricular-box">
          {cocurricularText}
        </div>
      </section>

      {/* 4. EKSTRAKURIKULER (4 BARIS KOMPAK) */}
      <section className="student-report-extracurricular-section">
        <table className="student-report-table student-report-small-table student-report-extracurricular-table">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '31%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '48%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>No.</th>
              <th>Ekstrakurikuler</th>
              <th>Predikat</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {ekskulRows.map((item) => (
              <tr key={item.number}>
                <td className="col-no">{item.number}</td>
                <td className="col-mapel">{item.name}</td>
                <td className="col-nilai">{item.grade}</td>
                <td className="col-capaian">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 5. KETIDAKHADIRAN (TABEL KECIL DI SISI KIRI) */}
      <section className="student-report-attendance-section" style={{ width: '48mm', maxWidth: '48mm', minWidth: 0, display: 'block', margin: '2.5mm 0 0 0' }}>
        <table className="student-report-attendance-table" style={{ width: '48mm', maxWidth: '48mm', minWidth: 0, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '31mm' }} />
            <col style={{ width: '8.5mm' }} />
            <col style={{ width: '8.5mm' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan="3">Ketidakhadiran</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>Sakit</td>
              <td className="col-val">{attendance?.is_recorded && attendance?.sick != null ? attendance.sick : '-'}</td>
              <td className="col-unit">hari</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Izin</td>
              <td className="col-val">{attendance?.is_recorded && attendance?.permitted != null ? attendance.permitted : '-'}</td>
              <td className="col-unit">hari</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Tanpa Keterangan</td>
              <td className="col-val">{attendance?.is_recorded && attendance?.absent != null ? attendance.absent : '-'}</td>
              <td className="col-unit">hari</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 6. CATATAN WALI KELAS */}
      <section className="student-report-note-section">
        <div className="student-report-note-title">Catatan Wali Kelas</div>
        <div className="student-report-note-box">{report?.homeroom_note || '-'}</div>
      </section>

      {/* 7. TANDA TANGAN (RAPAT LANGSUNG DI BAWAH CATATAN) */}
      <div className="student-report-signatures">
        <div className="student-report-sig-parent">
          <span>Mengetahui :</span>
          <span>Orang Tua/Wali,</span>
          <span className="student-report-sig-line">..........................</span>
        </div>
        <div className="student-report-sig-homeroom">
          <span>{city ? city : 'Garut'}, {reportDate || '-'}</span>
          <span>Wali Kelas,</span>
          <strong>{empty(homeroomTeacherName)}</strong>
          <span>NIP. {empty(homeroomTeacherNip)}</span>
        </div>
        <div className="student-report-principal">
          <span>Mengetahui,</span>
          <span>Kepala Sekolah</span>
          <strong>{empty(principalName)}</strong>
          {principalNip && principalNip !== '-' && <span>NIP. {principalNip}</span>}
        </div>
      </div>
    </div>
  )
}

function ReportDocumentPage({
  page,
  student,
  school,
  phase,
  report,
  cocurriculars,
  homeroom,
  reportDate,
  city,
}) {
  return (
    <article className={`report-document-page student-report-page ${page.isFinal ? 'student-report-page-final' : ''}`}>
      <div className="student-report-content">
        <Identity student={student} school={school} phase={phase} />
        {page.rows && page.rows.length > 0 && <AcademicTable rows={page.rows} isCompact={page.isFinal} />}
        {page.isFinal && (
          <Supplementary
            cocurriculars={cocurriculars}
            city={city}
            homeroom={homeroom}
            report={report}
            reportDate={reportDate}
            school={school}
          />
        )}
      </div>
    </article>
  )
}

export default function StudentReportDocument({ report, school, homeroom, reportDate, cocurriculars }) {
  const containerRef = useRef(null)
  const [zoomMode, setZoomMode] = useState('fit')
  const [fitScale, setFitScale] = useState(1)

  const academicResults = report?.academic_results ?? []

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const updateScale = () => {
      const parent = container.parentElement || container
      const style = window.getComputedStyle(parent)
      const paddingH = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0')
      const availableWidth = parent.clientWidth - paddingH - 32
      // Desktop: scale is exactly 1 (never expands above natural size). Mobile/tablet: scale down proportionally
      const calculated = Math.min(1, Math.max(0.35, availableWidth / A4_WIDTH_PX))
      setFitScale(calculated)
    }

    const observer = new ResizeObserver(updateScale)
    observer.observe(container.parentElement || container)
    updateScale()

    return () => observer.disconnect()
  }, [])

  // Guarantee exact 3 A4 pages following SMAN 27 Garut structure
  const documentPages = buildDocumentPages(academicResults)
  const student = report?.student || {}
  const className = String(student?.class_name ?? '')
  const grade = className.match(/\b(XII|XI|X)\b/i)?.[0]?.toUpperCase()
  const phase = grade === 'X' ? 'E' : grade ? 'F' : 'E'

  const rawCity = school?.city || initialSchoolIdentity.city || 'Garut'
  const city = String(rawCity).replace(/^(Kabupaten|Kota)\s+/i, '').trim() || 'Garut'

  // Only use authoritative reportDate if provided; otherwise display '-' (never use new Date())
  let dateText = '-'
  if (reportDate && reportDate !== '-') {
    try {
      dateText = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${reportDate}T00:00:00Z`))
    } catch {
      dateText = reportDate
    }
  }

  const previewScale = zoomMode === 'fit' ? fitScale : 1.0
  const isScaled = previewScale < 0.999
  const scaledWidth = Math.round(A4_WIDTH_PX * previewScale)
  const scaledHeight = Math.round(A4_HEIGHT_PX * previewScale)

  return (
    <div className="student-report-document-container" ref={containerRef} aria-label="Pratinjau Dokumen Rapor SMAN 27 Garut">
      <header className="student-report-toolbar" aria-label="Toolbar kontrol pratinjau rapor">
        <div className="student-report-toolbar-info">
          <span className="student-report-toolbar-title">Pratinjau Dokumen Rapor (3 Halaman A4)</span>
          <span className="student-report-toolbar-badge">A4 Portrait</span>
        </div>
        <div className="student-report-toolbar-actions">
          <button
            type="button"
            className={`student-report-zoom-btn ${zoomMode === 'fit' ? 'active' : ''}`}
            onClick={() => setZoomMode('fit')}
          >
            Fit Lebar ({Math.round(fitScale * 100)}%)
          </button>
          <button
            type="button"
            className={`student-report-zoom-btn ${zoomMode === '100%' ? 'active' : ''}`}
            onClick={() => setZoomMode('100%')}
          >
            100%
          </button>
        </div>
      </header>

      <div className="report-document-stack student-report-document-stack">
        {documentPages.map((page, index) => (
          <div
            key={page.pageNumber || index + 1}
            className="report-page-frame student-report-page-frame"
            style={
              isScaled
                ? {
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                  }
                : undefined
            }
          >
            <div
              className="student-report-page-scaler"
              style={
                isScaled
                  ? {
                      width: `${A4_WIDTH_PX}px`,
                      height: `${A4_HEIGHT_PX}px`,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                    }
                  : undefined
              }
            >
              <ReportDocumentPage
                city={city}
                cocurriculars={cocurriculars}
                homeroom={homeroom}
                page={page}
                phase={phase}
                report={report}
                reportDate={dateText}
                school={school}
                student={student}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
