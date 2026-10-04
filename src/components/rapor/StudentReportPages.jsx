import { getCurrentSchoolIdentity } from '../../services/schoolIdentitySession.js'

const dash = (value) => {
  const text = String(value ?? '').trim()
  return text || '-'
}

const scoreText = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? String(Math.round(number)) : '-'
}

function StudentIdentity({ student, semesterName, academicYearName }) {
  return (
    <div className="student-report-identity">
      <div>
        <span>Nama Peserta Didik</span><b>:</b><strong>{dash(student?.name)}</strong>
        <span>NIS/NISN</span><b>:</b><strong>{dash(student?.nis)} / {dash(student?.nisn)}</strong>
        <span>Nama Sekolah</span><b>:</b><strong>SMA Negeri 27 Garut</strong>
        <span>Alamat</span><b>:</b><strong>Jl. Raya Limbangan</strong>
      </div>
      <div>
        <span>Kelas</span><b>:</b><strong>{dash(student?.class_name)}</strong>
        <span>Fase</span><b>:</b><strong>E</strong>
        <span>Semester</span><b>:</b><strong>{dash(semesterName)}</strong>
        <span>Tahun Ajaran</span><b>:</b><strong>{dash(academicYearName)}</strong>
      </div>
    </div>
  )
}

function AcademicTable({ rows, startIndex }) {
  return (
    <table className="student-report-table student-report-academic-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Mata Pelajaran</th>
          <th>Nilai Akhir</th>
          <th>Capaian Kompetensi</th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((row, index) => (
          <tr key={`${row.subject || 'mapel'}-${startIndex + index}`}>
            <td>{startIndex + index + 1}</td>
            <td>{dash(row.subject)}</td>
            <td>{scoreText(row.score)}</td>
            <td>{dash(row.description)}</td>
          </tr>
        )) : (
          <tr className="student-report-empty-row">
            <td colSpan="4">
              Belum ada nilai akademik pada konteks ini. Format rapor tetap ditampilkan agar struktur dokumen dapat diperiksa.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function SignatureBlock({ school }) {
  const city = String(school?.city || 'Garut').replace(/^(Kabupaten|Kota)\s+/i, '').trim() || 'Garut'
  const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="student-report-signatures">
      <div>
        <span>Mengetahui :</span>
        <span>Orang Tua/Wali,</span>
        <strong>............................</strong>
      </div>
      <div>
        <span>{city}, {date}</span>
        <span>Wali Kelas,</span>
        <strong>{dash(school?.homeroomTeacher)}</strong>
        <small>NIP. {dash(school?.homeroomTeacherNip)}</small>
      </div>
      <div className="student-report-principal">
        <span>Mengetahui,</span>
        <span>Kepala Sekolah</span>
        <strong>{dash(school?.principal)}</strong>
        <small>NIP. {dash(school?.principalNip || '198003042003122006')}</small>
      </div>
    </div>
  )
}

export default function StudentReportPages({
  reportData,
  results,
  studentInfo,
  semesterName,
  academicYearName,
  cocurriculars = [],
  supplementaryLoading = false,
  supplementaryError = '',
}) {
  const school = getCurrentSchoolIdentity()
  const firstPage = results.slice(0, 5)
  const secondPage = results.slice(5, 10)
  const finalAcademicRows = results.slice(10)

  const extracurriculars = reportData?.extracurriculars ?? []
  const attendance = reportData?.attendance ?? {}
  const homeroomNote = reportData?.homeroom_note

  return (
    <div className="student-report-pages" data-testid="student-report-pages">
      <article className="student-report-page">
        <StudentIdentity student={studentInfo} semesterName={semesterName} academicYearName={academicYearName} />
        <AcademicTable rows={firstPage} startIndex={0} />
      </article>

      <article className="student-report-page">
        <StudentIdentity student={studentInfo} semesterName={semesterName} academicYearName={academicYearName} />
        <AcademicTable rows={secondPage} startIndex={5} />
      </article>

      <article className="student-report-page student-report-final-page">
        <StudentIdentity student={studentInfo} semesterName={semesterName} academicYearName={academicYearName} />
        {finalAcademicRows.length > 0 && <AcademicTable rows={finalAcademicRows} startIndex={10} />}

        <section className="student-report-section">
          <h4>Kokurikuler</h4>
          {supplementaryError ? (
            <p className="student-report-muted">{supplementaryError}</p>
          ) : supplementaryLoading ? (
            <p className="student-report-muted">Memuat data kokurikuler...</p>
          ) : cocurriculars.length ? (
            cocurriculars.map((item, index) => (
              <div className="student-report-box" key={`${item.title || 'kokurikuler'}-${index}`}>
                <strong>{dash(item.title || 'Kokurikuler')}</strong>
                <p>{dash(item.description)}</p>
              </div>
            ))
          ) : (
            <div className="student-report-box"><p>-</p></div>
          )}
        </section>

        <section className="student-report-section">
          <h4>Ekstrakurikuler</h4>
          <table className="student-report-table student-report-small-table">
            <thead><tr><th>No.</th><th>Ekstrakurikuler</th><th>Predikat</th><th>Keterangan</th></tr></thead>
            <tbody>
              {extracurriculars.length ? extracurriculars.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{dash(item.name || item.activity_name)}</td>
                  <td>{dash(item.grade || item.predicate)}</td>
                  <td>{dash(item.description)}</td>
                </tr>
              )) : <tr><td>1</td><td>-</td><td>-</td><td>-</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="student-report-section student-report-attendance-section">
          <h4>Ketidakhadiran</h4>
          <table className="student-report-table student-report-attendance-table">
            <tbody>
              <tr><td>Sakit</td><td>{attendance?.is_recorded ? attendance.sick : '-'}</td><td>hari</td></tr>
              <tr><td>Izin</td><td>{attendance?.is_recorded ? attendance.permitted : '-'}</td><td>hari</td></tr>
              <tr><td>Tanpa Keterangan</td><td>{attendance?.is_recorded ? attendance.absent : '-'}</td><td>hari</td></tr>
            </tbody>
          </table>
        </section>

        <section className="student-report-section">
          <h4>Catatan Wali Kelas</h4>
          <div className="student-report-box student-report-note">{dash(homeroomNote)}</div>
        </section>

        <SignatureBlock school={school} />
      </article>
    </div>
  )
}
