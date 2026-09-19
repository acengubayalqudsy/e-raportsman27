import { useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import {
  assessmentOptions,
  calculateFinalScore,
  formatScore,
  getPredicate,
  recapSubjects,
  scoreStudents,
  validationSubjects,
} from '../../data/penilaian.js'

function ContextFilters({ includeAssessment = false }) {
  return (
    <div className="assessment-context-filters">
      <label className="assessment-field">
        <span>Kelas</span>
        <select defaultValue={assessmentOptions.classes[0]}>
          {assessmentOptions.classes.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="assessment-field">
        <span>Mata Pelajaran</span>
        <select defaultValue={assessmentOptions.subjects[0]}>
          {assessmentOptions.subjects.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      {includeAssessment && (
        <label className="assessment-field">
          <span>Penilaian</span>
          <select defaultValue={assessmentOptions.assessmentTypes[0]}>
            {assessmentOptions.assessmentTypes.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      )}
      <label className="assessment-field">
        <span>Semester</span>
        <select defaultValue={assessmentOptions.semesters[0]}>
          {assessmentOptions.semesters.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    </div>
  )
}

function SectionHeading({ icon, title, description, action }) {
  return (
    <div className="assessment-section-heading">
      <div>
        <span><Icon name={icon} /></span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function NilaiPerMapelView() {
  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters includeAssessment />
      <div className="assessment-secondary-card">
        <SectionHeading
          description="Monitoring kelengkapan nilai Matematika kelas X Merdeka 3."
          icon="table"
          title="Nilai Per Mata Pelajaran"
        />
        <div className="assessment-table-scroll">
          <table className="assessment-review-table">
            <thead>
              <tr>
                <th>No</th><th>NIS</th><th>Nama Siswa</th><th>Tugas</th><th>UTS</th><th>UAS</th>
                <th>Praktik</th><th>Nilai Akhir</th><th>Predikat</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scoreStudents.slice(0, 8).map((student, index) => {
                const finalScore = calculateFinalScore(student.initialScores)
                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.nis}</td>
                    <td className="assessment-student-name">{student.name}</td>
                    <td>{student.initialScores.tugas}</td>
                    <td>{student.initialScores.uts}</td>
                    <td>{student.initialScores.uas}</td>
                    <td>{student.initialScores.praktik}</td>
                    <td><strong className="assessment-final-score">{formatScore(finalScore)}</strong></td>
                    <td><span className="assessment-predicate predicate-b">{getPredicate(finalScore)}</span></td>
                    <td><span className="assessment-status complete">Lengkap</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function NilaiSikapView({ onNotify }) {
  const initialAttitudes = Object.fromEntries(
    scoreStudents.slice(0, 8).map((student, index) => [
      student.id,
      {
        predicate: index % 3 === 0 ? 'Sangat Baik' : 'Baik',
        description: 'Menunjukkan kedisiplinan dan tanggung jawab yang baik selama pembelajaran.',
      },
    ]),
  )
  const [attitudes, setAttitudes] = useState(initialAttitudes)

  const updateAttitude = (id, key, value) => {
    setAttitudes((current) => ({ ...current, [id]: { ...current[id], [key]: value } }))
  }

  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters />
      <div className="assessment-secondary-card">
        <SectionHeading
          action={<Button className="assessment-button primary" onClick={() => onNotify('Nilai sikap berhasil disimpan.')}><Icon name="save" />Simpan Nilai Sikap</Button>}
          description="Catat predikat dan deskripsi sikap siswa untuk semester aktif."
          icon="shield"
          title="Nilai Sikap"
        />
        <div className="assessment-table-scroll">
          <table className="assessment-attitude-table">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Predikat Sikap</th><th>Catatan / Deskripsi</th><th>Status</th></tr></thead>
            <tbody>
              {scoreStudents.slice(0, 8).map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.nis}</td>
                  <td className="assessment-student-name">{student.name}</td>
                  <td>
                    <select value={attitudes[student.id].predicate} onChange={(event) => updateAttitude(student.id, 'predicate', event.target.value)}>
                      <option>Sangat Baik</option><option>Baik</option><option>Cukup</option><option>Perlu Pembinaan</option>
                    </select>
                  </td>
                  <td>
                    <textarea aria-label={`Deskripsi sikap ${student.name}`} onChange={(event) => updateAttitude(student.id, 'description', event.target.value)} value={attitudes[student.id].description} />
                  </td>
                  <td><span className="assessment-status complete">Lengkap</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function CapaianKompetensiView({ onNotify }) {
  const initialDescriptions = Object.fromEntries(
    scoreStudents.slice(0, 8).map((student) => [
      student.id,
      'Menunjukkan penguasaan yang baik dalam memahami konsep aljabar dan mampu menyelesaikan permasalahan matematika dengan baik.',
    ]),
  )
  const [descriptions, setDescriptions] = useState(initialDescriptions)

  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters />
      <div className="assessment-secondary-card">
        <SectionHeading
          action={<Button className="assessment-button primary" onClick={() => onNotify('Deskripsi capaian kompetensi berhasil disimpan.')}><Icon name="save" />Simpan Deskripsi</Button>}
          description="Susun deskripsi berdasarkan hasil nilai akhir setiap siswa."
          icon="sliders"
          title="Capaian Kompetensi (Deskripsi)"
        />
        <div className="assessment-competency-list">
          {scoreStudents.slice(0, 6).map((student) => {
            const finalScore = calculateFinalScore(student.initialScores)
            return (
              <article className="assessment-competency-row" key={student.id}>
                <div className="assessment-competency-student">
                  <span>{student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                  <div><strong>{student.name}</strong><small>{student.nis}</small></div>
                </div>
                <div className="assessment-competency-score"><small>Nilai Akhir</small><strong>{formatScore(finalScore)}</strong><span>{getPredicate(finalScore)}</span></div>
                <label><span>Capaian Kompetensi</span><textarea onChange={(event) => setDescriptions((current) => ({ ...current, [student.id]: event.target.value }))} value={descriptions[student.id]} /></label>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function scoreForSubject(studentId, subjectIndex) {
  return 72 + ((studentId * 7 + subjectIndex * 3) % 23)
}

function RekapNilaiView() {
  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters />
      <div className="assessment-secondary-card">
        <SectionHeading
          description="Ringkasan nilai seluruh mata pelajaran dalam format leger kelas."
          icon="table"
          title="Rekap Nilai Per Kelas"
        />
        <div className="assessment-table-scroll assessment-recap-scroll">
          <table className="assessment-recap-table">
            <thead><tr><th>No</th><th>Nama Siswa</th>{recapSubjects.map((subject) => <th key={subject}>{subject}</th>)}<th>Jumlah</th><th>Rata-rata</th></tr></thead>
            <tbody>
              {scoreStudents.slice(0, 8).map((student, index) => {
                const subjectScores = recapSubjects.map((_, subjectIndex) => scoreForSubject(student.id, subjectIndex))
                const total = subjectScores.reduce((sum, score) => sum + score, 0)
                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td><td className="assessment-recap-name"><strong>{student.name}</strong><span>{student.nis}</span></td>
                    {subjectScores.map((score, subjectIndex) => <td key={`${student.id}-${recapSubjects[subjectIndex]}`}>{score}</td>)}
                    <td><strong>{total}</strong></td><td><strong className="assessment-final-score">{formatScore(total / subjectScores.length)}</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ValidasiNilaiView({ onNotify }) {
  const [validated, setValidated] = useState(() => new Set())

  const validate = (subject) => {
    setValidated((current) => new Set(current).add(subject.id))
    onNotify(`Nilai ${subject.subject} berhasil divalidasi.`)
  }

  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters />
      <div className="assessment-secondary-card">
        <SectionHeading
          description="Pastikan nilai dan deskripsi lengkap sebelum digunakan pada Rapor & Leger."
          icon="check"
          title="Validasi Nilai"
        />
        <div className="assessment-validation-grid">
          {validationSubjects.map((subject) => {
            const isValidated = validated.has(subject.id)
            const isComplete = subject.scored === 36 && subject.descriptions === 36
            const status = isValidated ? 'Sudah Divalidasi' : isComplete ? 'Siap Divalidasi' : 'Belum Lengkap'
            return (
              <article className="assessment-validation-card" key={subject.id}>
                <div className="assessment-validation-head"><span><Icon name="book" /></span><div><h4>{subject.subject}</h4><p>{subject.teacher}</p></div></div>
                <dl>
                  <div><dt>Jumlah siswa</dt><dd>36</dd></div>
                  <div><dt>Sudah dinilai</dt><dd>{subject.scored}</dd></div>
                  <div><dt>Mempunyai nilai akhir</dt><dd>{subject.scored}</dd></div>
                  <div><dt>Mempunyai deskripsi</dt><dd>{subject.descriptions}</dd></div>
                </dl>
                <div className="assessment-validation-footer">
                  <span className={`assessment-status ${isValidated ? 'validated' : isComplete ? 'ready' : 'incomplete'}`}>{status}</span>
                  <Button className="assessment-validate-button" disabled={!isComplete || isValidated} onClick={() => validate(subject)}>{isValidated ? <Icon name="check" /> : null}{isValidated ? 'Tervalidasi' : 'Validasi'}</Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AssessmentSectionViews({ activeKey, onNotify }) {
  if (activeKey === 'nilai-per-mapel') return <NilaiPerMapelView />
  if (activeKey === 'nilai-sikap') return <NilaiSikapView onNotify={onNotify} />
  if (activeKey === 'capaian-kompetensi') return <CapaianKompetensiView onNotify={onNotify} />
  if (activeKey === 'rekap-nilai-per-kelas') return <RekapNilaiView />
  if (activeKey === 'validasi-nilai') return <ValidasiNilaiView onNotify={onNotify} />
  return null
}

export default AssessmentSectionViews
