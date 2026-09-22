import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import assessmentService from '../../services/assessmentService.js'
import { formatRaporScore, raporStudents, schoolIdentity } from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'

function StudentRaporPreview({ onNotify }) {
  const [studentId, setStudentId] = useState(String(raporStudents[0].id))
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fallbackStudent = raporStudents.find((item) => String(item.id) === studentId) ?? raporStudents[0]

  useEffect(() => {
    let isMounted = true
    async function loadReport() {
      setLoading(true)
      const res = await assessmentService.getReportCard(studentId)
      if (isMounted && res.success && res.data) {
        setReportData(res.data)
      } else if (isMounted) {
        setReportData(null)
      }
      if (isMounted) setLoading(false)
    }
    loadReport()
    return () => { isMounted = false }
  }, [studentId])

  const studentInfo = reportData?.student || {
    name: fallbackStudent.name,
    nis: fallbackStudent.nis,
    nisn: fallbackStudent.nisn,
    birth: fallbackStudent.birth,
    class_name: fallbackStudent.className,
    semester_name: fallbackStudent.semester,
    academic_year_name: fallbackStudent.academicYear,
  }

  const results = reportData?.academic_results?.length
    ? reportData.academic_results.map((r) => ({
        subject: r.subject_name,
        score: r.score,
        predicate: r.score >= 85 ? 'A' : r.score >= 75 ? 'B' : 'C',
        description: r.highest_achievement || '-',
      }))
    : fallbackStudent.academicResults

  const reportStatus = reportData?.report_status || 'DRAF PRATINJAU'

  const handlePrint = () => {
    window.print()
    if (onNotify) onNotify('Membuka dialog pencetakan rapor...')
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters
        includeStudent
        onChange={(key, value) => { if (key === 'studentId') setStudentId(value) }}
        values={{ studentId }}
      />
      <div className="report-preview-toolbar">
        <div>
          <span><Icon name="user" /></span>
          <div>
            <strong>{studentInfo.name}</strong>
            <small>NIS {studentInfo.nis} &bull; NISN {studentInfo.nisn}</small>
          </div>
          <span style={{
            marginLeft: '1rem',
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 600,
            background: reportStatus === 'TERVALIDASI' ? '#dcfce7' : '#fef3c7',
            color: reportStatus === 'TERVALIDASI' ? '#166534' : '#92400e',
          }}>
            {reportStatus}
          </span>
        </div>
        <div>
          <Button className="report-button secondary" onClick={handlePrint}>
            <Icon name="eye" />
            Preview Cetak
          </Button>
          <Button className="report-button primary" onClick={handlePrint}>
            <Icon name="download" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Memuat data rapor...</p>
      ) : (
        <article className="report-paper">
          <header className="report-paper-header">
            <div className="report-paper-crest">
              <img alt="Logo SMAN 27 Garut" src={sman27Logo} />
            </div>
            <div>
              <p>RAPOR PESERTA DIDIK (KURIKULUM MERDEKA)</p>
              <h3>{schoolIdentity.name}</h3>
              <small>{schoolIdentity.address}</small>
            </div>
          </header>

          <section className="report-paper-identity">
            <dl>
              <div><dt>Nama Peserta Didik</dt><dd>{studentInfo.name}</dd></div>
              <div><dt>NIS / NISN</dt><dd>{studentInfo.nis} / {studentInfo.nisn}</dd></div>
              <div><dt>Tempat, Tanggal Lahir</dt><dd>{studentInfo.birth}</dd></div>
            </dl>
            <dl>
              <div><dt>Kelas</dt><dd>{studentInfo.class_name}</dd></div>
              <div><dt>Semester</dt><dd>{studentInfo.semester_name}</dd></div>
              <div><dt>Tahun Ajaran</dt><dd>{studentInfo.academic_year_name}</dd></div>
            </dl>
          </section>

          <section className="report-paper-section">
            <h4>A. NILAI AKADEMIK & CAPAIAN KOMPETENSI</h4>
            <div className="report-table-scroll">
              <table className="report-paper-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Mata Pelajaran</th>
                    <th>Nilai Akhir</th>
                    <th>Predikat</th>
                    <th>Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.subject || index}>
                      <td>{index + 1}</td>
                      <td>{result.subject}</td>
                      <td><strong>{formatRaporScore(result.score)}</strong></td>
                      <td>{result.predicate}</td>
                      <td style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{result.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="report-paper-two-column">
            <section className="report-paper-section">
              <h4>B. EKSTRAKURIKULER</h4>
              {reportData?.extracurriculars?.length ? (
                reportData.extracurriculars.map((item, idx) => (
                  <div className="report-extracurricular" key={item.name || idx}>
                    <strong>{item.name}</strong>
                    <span>{item.grade}</span>
                    <p>{item.description || '-'}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Belum ada kegiatan ekstrakurikuler yang dicatat untuk semester ini.
                </p>
              )}
            </section>
            <section className="report-paper-section">
              <h4>C. KETIDAKHADIRAN</h4>
              {reportData?.attendance?.is_recorded ? (
                <dl className="report-attendance">
                  <div><dt>Sakit</dt><dd>{reportData.attendance.sick} hari</dd></div>
                  <div><dt>Izin</dt><dd>{reportData.attendance.permitted} hari</dd></div>
                  <div><dt>Tanpa Keterangan</dt><dd>{reportData.attendance.absent} hari</dd></div>
                </dl>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Rekap kehadiran semester belum dicatat oleh wali kelas.
                </p>
              )}
            </section>
          </div>

          {reportData?.cocurricular && (
            <section className="report-paper-section">
              <h4>D. PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)</h4>
              <div style={{ padding: '0.5rem 0' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{reportData.cocurricular.title}</strong>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#334155' }}>{reportData.cocurricular.description}</p>
              </div>
            </section>
          )}

          <section className="report-paper-section">
            <h4>{reportData?.cocurricular ? 'E.' : 'D.'} CATATAN WALI KELAS</h4>
            {reportData?.homeroom_note ? (
              <p className="report-homeroom-note">{reportData.homeroom_note}</p>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Catatan perkembangan dan motivasi siswa belum diisi oleh wali kelas.
              </p>
            )}
          </section>

          {!reportData?.is_approved_by_school && (
            <div style={{
              margin: '1.5rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid #fde68a',
              background: '#fffbeb',
              fontSize: '0.8rem',
              color: '#92400e',
            }}>
              <strong>Perhatian (PENDING SCHOOL APPROVAL):</strong> Dokumen ini berstatus <em>Draf Pratinjau</em>. Konfigurasi rumus pembobotan penilaian dan format definitif masih menunggu verifikasi resmi kepala sekolah/kurikulum SMAN 27 Garut.
            </div>
          )}
        </article>
      )}
    </section>
  )
}

export default StudentRaporPreview
