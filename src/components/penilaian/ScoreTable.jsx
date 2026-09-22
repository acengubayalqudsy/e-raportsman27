import Icon from '../common/Icon.jsx'
import { calculateFinalScore, formatScore, getPredicate } from '../../data/penilaian.js'

const scoreFields = [
  { key: 'tugas', label: 'Tugas', weight: '20%' },
  { key: 'uts', label: 'UTS', weight: '30%' },
  { key: 'uas', label: 'UAS', weight: '40%' },
  { key: 'praktik', label: 'Praktik', weight: '10%' },
]

function ScoreInput({ field, student, onChange, disabled }) {
  const val = student.scores ? student.scores[field.key] : ''
  return (
    <input
      aria-label={`${field.label} ${student.name}`}
      className="assessment-score-input"
      disabled={disabled}
      max="100"
      min="0"
      onChange={(event) => onChange(student.id, field.key, event.target.value)}
      type="number"
      value={val !== null && val !== undefined ? val : ''}
    />
  )
}

function ScoreTable({
  students,
  startIndex,
  savedRows,
  onScoreChange,
  onSave,
  onReset,
  subject,
  assessmentType,
  assessments = [],
  isLocked = false,
  onCalculateFinal,
}) {
  const activeFields = assessments && assessments.length > 0
    ? assessments.map((a) => ({
        key: String(a.id),
        label: a.title,
        weight: a.type === 'Sumatif Lingkup Materi' ? 'Sumatif' : a.type === 'Sumatif Akhir Semester' ? 'SAS' : 'Formatif',
      }))
    : scoreFields

  return (
    <div className="assessment-table-card">
      <div className="assessment-table-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Daftar Nilai - {subject} ({assessmentType})</strong>
          <span>{isLocked ? '🔒 Nilai telah divalidasi & dikunci oleh Wali Kelas' : 'Bobot nilai & capaian kompetensi dikalkulasi otomatis'}</span>
        </div>
        {onCalculateFinal && (
          <button
            className="assessment-button secondary"
            disabled={isLocked}
            onClick={onCalculateFinal}
            style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
            type="button"
          >
            <Icon name="trend" />
            Kalkulasi Nilai Akhir
          </button>
        )}
      </div>

      <div className="assessment-table-scroll">
        <table className="assessment-score-table">
          <thead>
            <tr>
              <th rowSpan="2">No</th>
              <th rowSpan="2">NIS</th>
              <th rowSpan="2">Nama Siswa</th>
              <th rowSpan="2">KKTP</th>
              <th colSpan={activeFields.length}>Nilai</th>
              <th rowSpan="2">Nilai Akhir</th>
              <th rowSpan="2">Predikat</th>
              <th rowSpan="2">Aksi</th>
            </tr>
            <tr>
              {activeFields.map((field) => (
                <th key={field.key}>
                  <span>{field.label}</span>
                  <small>{field.weight}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td className="assessment-empty-row" colSpan={activeFields.length + 7}>
                  <Icon name="search" />
                  <strong>Tidak ada siswa yang sesuai pencarian.</strong>
                  <span>Coba gunakan NIS atau nama siswa yang berbeda.</span>
                </td>
              </tr>
            ) : (
              students.map((student, index) => {
                const finalScore = student.final_grade?.score ?? calculateFinalScore(student.scores || {})
                const predicate = getPredicate(finalScore)
                const kkmVal = student.kkm ?? 75
                const belowKkm = finalScore < kkmVal

                return (
                  <tr className={savedRows.has(student.id) ? 'saved' : ''} key={student.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{student.nis}</td>
                    <td className="assessment-student-name">{student.name}</td>
                    <td>{kkmVal}</td>
                    {activeFields.map((field) => (
                      <td key={field.key}>
                        <ScoreInput
                          disabled={isLocked}
                          field={field}
                          onChange={onScoreChange}
                          student={student}
                        />
                      </td>
                    ))}
                    <td>
                      <strong className={`assessment-final-score ${belowKkm ? 'warning' : ''}`}>
                        {finalScore !== null && finalScore !== undefined ? formatScore(finalScore) : '-'}
                      </strong>
                    </td>
                    <td>
                      <span className={`assessment-predicate predicate-${predicate.toLowerCase().replace('-', 'minus')}`}>
                        {predicate}
                      </span>
                    </td>
                    <td>
                      <div className="assessment-row-actions">
                        <button
                          aria-label={`Simpan nilai ${student.name}`}
                          className={savedRows.has(student.id) ? 'saved' : ''}
                          disabled={isLocked}
                          onClick={() => onSave(student)}
                          title={savedRows.has(student.id) ? 'Tersimpan' : 'Simpan'}
                          type="button"
                        >
                          <Icon name={savedRows.has(student.id) ? 'check' : 'save'} />
                        </button>
                        <button
                          aria-label={`Reset nilai ${student.name}`}
                          disabled={isLocked}
                          onClick={() => onReset(student)}
                          title="Reset nilai"
                          type="button"
                        >
                          <Icon name="reset" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ScoreTable
