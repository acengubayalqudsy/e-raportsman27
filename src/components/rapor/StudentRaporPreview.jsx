import { useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import { formatRaporScore, raporStudents, schoolIdentity } from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'

function StudentRaporPreview({ onNotify }) {
  const [studentId, setStudentId] = useState(String(raporStudents[0].id))
  const student = raporStudents.find((item) => String(item.id) === studentId) ?? raporStudents[0]

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters includeStudent values={{ studentId }} onChange={(key, value) => { if (key === 'studentId') setStudentId(value) }} />
      <div className="report-preview-toolbar">
        <div><span><Icon name="user" /></span><div><strong>{student.name}</strong><small>NIS {student.nis} &bull; NISN {student.nisn}</small></div></div>
        <div><Button className="report-button secondary" onClick={() => onNotify('Preview cetak siap ditampilkan.')}><Icon name="eye" />Preview Cetak</Button><Button className="report-button primary" onClick={() => onNotify('Fitur export PDF akan diintegrasikan pada tahap berikutnya.')}><Icon name="download" />Export PDF</Button></div>
      </div>

      <article className="report-paper">
        <header className="report-paper-header">
          <div className="report-paper-crest">
            <img src={sman27Logo} alt="Logo SMAN 27 Garut" />
          </div>
          <div><p>RAPOR PESERTA DIDIK</p><h3>{schoolIdentity.name}</h3><small>{schoolIdentity.address}</small></div>
        </header>

        <section className="report-paper-identity">
          <dl><div><dt>Nama Peserta Didik</dt><dd>{student.name}</dd></div><div><dt>NIS / NISN</dt><dd>{student.nis} / {student.nisn}</dd></div><div><dt>Tempat, Tanggal Lahir</dt><dd>{student.birth}</dd></div></dl>
          <dl><div><dt>Kelas</dt><dd>{student.className}</dd></div><div><dt>Semester</dt><dd>{student.semester}</dd></div><div><dt>Tahun Ajaran</dt><dd>{student.academicYear}</dd></div></dl>
        </section>

        <section className="report-paper-section">
          <h4>A. NILAI AKADEMIK</h4>
          <div className="report-table-scroll">
            <table className="report-paper-table">
              <thead><tr><th>No</th><th>Mata Pelajaran</th><th>Nilai Akhir</th><th>Predikat</th><th>Capaian Kompetensi</th></tr></thead>
              <tbody>{student.academicResults.map((result, index) => <tr key={result.subjectKey}><td>{index + 1}</td><td>{result.subject}</td><td><strong>{formatRaporScore(result.score)}</strong></td><td>{result.predicate}</td><td>{result.description}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <div className="report-paper-two-column">
          <section className="report-paper-section">
            <h4>B. EKSTRAKURIKULER</h4>
            {student.extracurriculars.map((item) => <div className="report-extracurricular" key={item.name}><strong>{item.name}</strong><span>{item.grade}</span><p>{item.description}</p></div>)}
          </section>
          <section className="report-paper-section">
            <h4>C. KETIDAKHADIRAN</h4>
            <dl className="report-attendance"><div><dt>Sakit</dt><dd>{student.attendance.sick} hari</dd></div><div><dt>Izin</dt><dd>{student.attendance.permitted} hari</dd></div><div><dt>Tanpa Keterangan</dt><dd>{student.attendance.absent} hari</dd></div></dl>
          </section>
        </div>
        <section className="report-paper-section"><h4>D. CATATAN WALI KELAS</h4><p className="report-homeroom-note">{student.homeroomNote}</p></section>
      </article>
    </section>
  )
}

export default StudentRaporPreview
