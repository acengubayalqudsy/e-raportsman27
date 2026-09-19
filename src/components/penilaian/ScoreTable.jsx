import Icon from '../common/Icon.jsx'
import { calculateFinalScore, formatScore, getPredicate } from '../../data/penilaian.js'

const scoreFields = [
  { key: 'tugas', label: 'Tugas', weight: '20%' },
  { key: 'uts', label: 'UTS', weight: '30%' },
  { key: 'uas', label: 'UAS', weight: '40%' },
  { key: 'praktik', label: 'Praktik', weight: '10%' },
]

function ScoreInput({ field, student, onChange }) {
  return (
    <input
      aria-label={`${field.label} ${student.name}`}
      className="assessment-score-input"
      max="100"
      min="0"
      onChange={(event) => onChange(student.id, field.key, event.target.value)}
      type="number"
      value={student.scores[field.key]}
    />
  )
}

function ScoreTable({ students, startIndex, savedRows, onScoreChange, onSave, onReset, subject, assessmentType }) {
  return (
    <div className="assessment-table-card">
      <div className="assessment-table-title">
        <strong>Daftar Nilai - {subject} ({assessmentType})</strong>
        <span>Bobot nilai diperbarui otomatis</span>
      </div>

      <div className="assessment-table-scroll">
        <table className="assessment-score-table">
          <thead>
            <tr>
              <th rowSpan="2">No</th>
              <th rowSpan="2">NIS</th>
              <th rowSpan="2">Nama Siswa</th>
              <th rowSpan="2">KKM</th>
              <th colSpan="4">Nilai</th>
              <th rowSpan="2">Nilai Akhir</th>
              <th rowSpan="2">Predikat</th>
              <th rowSpan="2">Aksi</th>
            </tr>
            <tr>
              {scoreFields.map((field) => (
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
                <td className="assessment-empty-row" colSpan="11">
                  <Icon name="search" />
                  <strong>Tidak ada siswa yang sesuai pencarian.</strong>
                  <span>Coba gunakan NIS atau nama siswa yang berbeda.</span>
                </td>
              </tr>
            ) : (
              students.map((student, index) => {
                const finalScore = calculateFinalScore(student.scores)
                const predicate = getPredicate(finalScore)
                const belowKkm = finalScore < student.kkm

                return (
                  <tr className={savedRows.has(student.id) ? 'saved' : ''} key={student.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{student.nis}</td>
                    <td className="assessment-student-name">{student.name}</td>
                    <td>{student.kkm}</td>
                    {scoreFields.map((field) => (
                      <td key={field.key}>
                        <ScoreInput field={field} onChange={onScoreChange} student={student} />
                      </td>
                    ))}
                    <td>
                      <strong className={`assessment-final-score ${belowKkm ? 'warning' : ''}`}>
                        {formatScore(finalScore)}
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
                          onClick={() => onSave(student)}
                          title={savedRows.has(student.id) ? 'Tersimpan' : 'Simpan'}
                          type="button"
                        >
                          <Icon name={savedRows.has(student.id) ? 'check' : 'save'} />
                        </button>
                        <button
                          aria-label={`Reset nilai ${student.name}`}
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
