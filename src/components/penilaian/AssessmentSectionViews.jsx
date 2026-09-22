import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import {
  formatScore,
  getPredicate,
} from '../../data/penilaian.js'

function ContextFilters({
  assignedCourses = [],
  selectedCourseId,
  onCourseChange,
}) {
  return (
    <div className="assessment-context-filters">
      <label className="assessment-field" style={{ minWidth: '240px' }}>
        <span>Pilih Mata Pelajaran & Kelas</span>
        <select
          value={selectedCourseId || ''}
          onChange={(e) => onCourseChange && onCourseChange(Number(e.target.value))}
        >
          {assignedCourses.length === 0 ? (
            <option value="">Tidak ada penugasan</option>
          ) : (
            assignedCourses.map((c) => (
              <option key={c.course_assignment_id} value={c.course_assignment_id}>
                {c.class_name} — {c.subject_name} ({c.role || 'Utama'})
              </option>
            ))
          )}
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
  const [assignedCourses, setAssignedCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await assessmentService.getContext()
      if (res.success && res.data?.assigned_courses?.length > 0) {
        setAssignedCourses(res.data.assigned_courses)
        setSelectedCourseId(res.data.assigned_courses[0].course_assignment_id)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) return
    async function loadGb() {
      setLoading(true)
      const res = await assessmentService.getGradebook(selectedCourseId)
      if (res.success && res.data) {
        setGradebook(res.data)
      }
      setLoading(false)
    }
    loadGb()
  }, [selectedCourseId])

  const students = gradebook?.students || []
  const assessments = gradebook?.assessments || []

  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters
        assignedCourses={assignedCourses}
        onCourseChange={setSelectedCourseId}
        selectedCourseId={selectedCourseId}
      />
      <div className="assessment-secondary-card">
        <SectionHeading
          description={`Monitoring rekapitulasi nilai ${gradebook?.course_assignment?.subject_name || ''} kelas ${gradebook?.course_assignment?.class_name || ''}.`}
          icon="table"
          title="Nilai Per Mata Pelajaran"
        />
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat data nilai...</p>
        ) : (
          <div className="assessment-table-scroll">
            <table className="assessment-review-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  {assessments.map((a) => (
                    <th key={a.id}>{a.title}</th>
                  ))}
                  <th>Nilai Akhir</th>
                  <th>Predikat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={assessments.length + 5} style={{ textAlign: 'center', padding: '2rem' }}>
                      Belum ada siswa atau data nilai tersimpan.
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const finalScore = student.final_grade?.score
                    const hasFinal = finalScore !== null && finalScore !== undefined
                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.nis}</td>
                        <td className="assessment-student-name">{student.name}</td>
                        {assessments.map((a) => {
                          const sc = student.scores?.[a.id]?.final_score
                          return <td key={a.id}>{sc !== null && sc !== undefined ? sc : '-'}</td>
                        })}
                        <td>
                          <strong className="assessment-final-score">
                            {hasFinal ? formatScore(finalScore) : '-'}
                          </strong>
                        </td>
                        <td>
                          <span className="assessment-predicate predicate-b">
                            {hasFinal ? getPredicate(finalScore) : '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`assessment-status ${hasFinal ? 'complete' : 'pending'}`}>
                            {hasFinal ? 'Lengkap' : 'Belum Lengkap'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function NilaiSikapView() {
  return (
    <section className="assessment-secondary-workspace">
      <div className="assessment-secondary-card">
        <SectionHeading
          description="Sesuai regulasi Kurikulum Merdeka (Kemendikbudristek), penilaian karakter & sikap diwadahi melalui Projek Penguatan Profil Pelajar Pancasila (P5) dan catatan perkembangan wali kelas."
          icon="shield"
          title="Nilai Sikap / Karakter (Kurikulum Merdeka)"
        />
        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Informasi Integrasi P5 & Karakter</h4>
          <p style={{ color: '#64748b', lineHeight: 1.6 }}>
            Modul ini disiapkan untuk integrasi Rapor P5 yang mencakup dimensi: Beriman & Bertakwa, Berkebinekaan Global, Bergotong Royong, Mandiri, Bernalar Kritis, dan Kreatif. Konfirmasi format spesifik SMAN 27 Garut akan diaktifkan pada modul Rapor.
          </p>
        </div>
      </div>
    </section>
  )
}

function CapaianKompetensiView({ onNotify }) {
  const [assignedCourses, setAssignedCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [students, setStudents] = useState([])
  const [descriptions, setDescriptions] = useState({})
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await assessmentService.getContext()
      if (res.success && res.data?.assigned_courses?.length > 0) {
        setAssignedCourses(res.data.assigned_courses)
        setSelectedCourseId(res.data.assigned_courses[0].course_assignment_id)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) return
    async function loadGb() {
      setLoading(true)
      const res = await assessmentService.getGradebook(selectedCourseId)
      if (res.success && res.data) {
        setIsLocked(Boolean(res.data.is_locked))
        const loadedStudents = res.data.students || []
        setStudents(loadedStudents)

        const initialDesc = {}
        loadedStudents.forEach((s) => {
          initialDesc[s.id] = s.final_grade?.highest_achievement || ''
        })
        setDescriptions(initialDesc)
      }
      setLoading(false)
    }
    loadGb()
  }, [selectedCourseId])

  const handleSaveDescriptions = async () => {
    if (!selectedCourseId) return
    if (isLocked) {
      onNotify('Nilai telah dikunci. Deskripsi capaian tidak dapat diubah.')
      return
    }

    const payload = students.map((s) => ({
      student_id: s.id,
      highest_achievement: descriptions[s.id] || '',
    }))

    const res = await assessmentService.updateCompetencyAchievements(selectedCourseId, payload)
    if (res.success) {
      onNotify('Deskripsi capaian kompetensi berhasil disimpan ke database.')
    } else {
      onNotify(res.error || 'Gagal menyimpan deskripsi.')
    }
  }

  return (
    <section className="assessment-secondary-workspace">
      <ContextFilters
        assignedCourses={assignedCourses}
        onCourseChange={setSelectedCourseId}
        selectedCourseId={selectedCourseId}
      />
      <div className="assessment-secondary-card">
        <SectionHeading
          action={
            <Button
              className="assessment-button primary"
              disabled={isLocked || students.length === 0}
              onClick={handleSaveDescriptions}
            >
              <Icon name="save" />
              Simpan Deskripsi
            </Button>
          }
          description="Susun narasi capaian kompetensi berdasarkan hasil nilai akhir siswa."
          icon="sliders"
          title="Capaian Kompetensi (Deskripsi)"
        />
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat deskripsi capaian...</p>
        ) : (
          <div className="assessment-competency-list">
            {students.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Belum ada siswa atau data nilai akhir. Silakan hitung nilai akhir terlebih dahulu pada tab Input Nilai.
              </p>
            ) : (
              students.map((student) => {
                const finalScore = student.final_grade?.score
                return (
                  <article className="assessment-competency-row" key={student.id}>
                    <div className="assessment-competency-student">
                      <span>{student.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                      <div>
                        <strong>{student.name}</strong>
                        <small>{student.nis}</small>
                      </div>
                    </div>
                    <div className="assessment-competency-score">
                      <small>Nilai Akhir</small>
                      <strong>{finalScore !== null && finalScore !== undefined ? formatScore(finalScore) : '-'}</strong>
                      <span>{finalScore !== null && finalScore !== undefined ? getPredicate(finalScore) : '-'}</span>
                    </div>
                    <label>
                      <span>Capaian Kompetensi</span>
                      <textarea
                        disabled={isLocked}
                        onChange={(e) => setDescriptions((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        placeholder="Deskripsi penguasaan capaian kompetensi..."
                        value={descriptions[student.id] || ''}
                      />
                    </label>
                  </article>
                )
              })
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function RekapNilaiView() {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [recapData, setRecapData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadClasses() {
      const res = await assessmentService.getContext()
      if (res.success && res.data) {
        const list = []
        if (res.data.homeroom_class) {
          list.push(res.data.homeroom_class)
        }
        if (res.data.assigned_courses) {
          res.data.assigned_courses.forEach((c) => {
            if (!list.find((item) => item.class_id === c.class_id)) {
              list.push({ class_id: c.class_id, class_name: c.class_name })
            }
          })
        }
        setClasses(list)
        if (list.length > 0) {
          setSelectedClassId(list[0].class_id)
        }
      }
    }
    loadClasses()
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    async function loadRecap() {
      setLoading(true)
      const res = await assessmentService.getClassRecap(selectedClassId, 1)
      if (res.success && res.data) {
        setRecapData(res.data)
      }
      setLoading(false)
    }
    loadRecap()
  }, [selectedClassId])

  const subjects = recapData?.subjects || []
  const students = recapData?.students || []

  return (
    <section className="assessment-secondary-workspace">
      <div className="assessment-context-filters">
        <label className="assessment-field" style={{ minWidth: '200px' }}>
          <span>Pilih Kelas</span>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
          >
            {classes.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="assessment-secondary-card">
        <SectionHeading
          description="Ringkasan nilai seluruh mata pelajaran dalam format leger kelas."
          icon="table"
          title={`Rekap Nilai Leger Kelas - ${recapData?.class?.name || ''}`}
        />
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat rekap leger kelas...</p>
        ) : (
          <div className="assessment-table-scroll assessment-recap-scroll">
            <table className="assessment-recap-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  {subjects.map((sbj) => (
                    <th key={sbj.id}>{sbj.name}</th>
                  ))}
                  <th>Jumlah</th>
                  <th>Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={subjects.length + 4} style={{ textAlign: 'center', padding: '2rem' }}>
                      Tidak ada data siswa atau nilai akhir belum dihitung.
                    </td>
                  </tr>
                ) : (
                  students.map((st, index) => (
                    <tr key={st.student_id}>
                      <td>{index + 1}</td>
                      <td className="assessment-recap-name">
                        <strong>{st.name}</strong>
                        <span>{st.nis}</span>
                      </td>
                      {subjects.map((sbj) => {
                        const val = st.scores?.[sbj.id]
                        return (
                          <td key={sbj.id}>
                            {val !== null && val !== undefined ? formatScore(val) : '-'}
                          </td>
                        )
                      })}
                      <td><strong>{st.total_score ? formatScore(st.total_score) : '-'}</strong></td>
                      <td>
                        <strong className="assessment-final-score">
                          {st.average_score ? formatScore(st.average_score) : '-'}
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function ValidasiNilaiView({ onNotify }) {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [validationList, setValidationList] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await assessmentService.getContext()
      if (res.success && res.data) {
        const list = []
        if (res.data.homeroom_class) {
          list.push(res.data.homeroom_class)
        }
        if (res.data.assigned_courses) {
          res.data.assigned_courses.forEach((c) => {
            if (!list.find((item) => item.class_id === c.class_id)) {
              list.push({ class_id: c.class_id, class_name: c.class_name })
            }
          })
        }
        setClasses(list)
        if (list.length > 0) {
          setSelectedClassId(list[0].class_id)
        }
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    let isMounted = true

    async function fetchStatus() {
      setLoading(true)
      const res = await assessmentService.getValidationStatus(selectedClassId, 1)
      if (isMounted && res.success && Array.isArray(res.data)) {
        setValidationList(res.data)
      }
      if (isMounted) setLoading(false)
    }

    fetchStatus()
    return () => { isMounted = false }
  }, [selectedClassId])

  const handleValidate = async (item) => {
    const res = await assessmentService.validateCourse(item.course_assignment_id, 'Divalidasi oleh Wali Kelas')
    if (res.success) {
      onNotify(`Nilai ${item.subject_name} berhasil divalidasi dan dikunci!`)
      const updated = await assessmentService.getValidationStatus(selectedClassId, 1)
      if (updated.success && Array.isArray(updated.data)) {
        setValidationList(updated.data)
      }
    } else {
      onNotify(res.error || 'Gagal memvalidasi nilai.')
    }
  }

  return (
    <section className="assessment-secondary-workspace">
      <div className="assessment-context-filters">
        <label className="assessment-field" style={{ minWidth: '200px' }}>
          <span>Pilih Kelas Binaannya</span>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
          >
            {classes.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>{cls.class_name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="assessment-secondary-card">
        <SectionHeading
          description="Pastikan nilai dan deskripsi capaian lengkap sebelum digunakan pada Rapor & Leger."
          icon="check"
          title="Validasi Nilai & Penguncian Rapor"
        />
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memeriksa status kelengkapan nilai...</p>
        ) : (
          <div className="assessment-validation-grid">
            {validationList.length === 0 ? (
              <p style={{ padding: '2rem', color: '#64748b', gridColumn: '1 / -1' }}>
                Tidak ada penugasan mata pelajaran yang terdaftar pada kelas ini.
              </p>
            ) : (
              validationList.map((subject) => (
                <article className="assessment-validation-card" key={subject.course_assignment_id}>
                  <div className="assessment-validation-head">
                    <span><Icon name="book" /></span>
                    <div>
                      <h4>{subject.subject_name}</h4>
                      <p>{subject.teacher_name || '-'}</p>
                    </div>
                  </div>
                  <dl>
                    <div><dt>Jumlah siswa rombel</dt><dd>{subject.total_students}</dd></div>
                    <div><dt>Sudah diinput nilai</dt><dd>{subject.scored_count}</dd></div>
                    <div><dt>Mempunyai nilai akhir</dt><dd>{subject.scored_count}</dd></div>
                    <div><dt>Mempunyai deskripsi</dt><dd>{subject.descriptions_count}</dd></div>
                  </dl>
                  <div className="assessment-validation-footer">
                    <span className={`assessment-status ${subject.is_locked ? 'validated' : subject.is_complete ? 'ready' : 'incomplete'}`}>
                      {subject.status}
                    </span>
                    <Button
                      className="assessment-validate-button"
                      disabled={!subject.is_complete || subject.is_locked}
                      onClick={() => handleValidate(subject)}
                    >
                      {subject.is_locked ? <Icon name="check" /> : null}
                      {subject.is_locked ? 'Tervalidasi (Terkunci)' : 'Validasi & Kunci'}
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function AssessmentSectionViews({ activeKey, onNotify }) {
  if (activeKey === 'nilai-per-mapel') return <NilaiPerMapelView onNotify={onNotify} />
  if (activeKey === 'nilai-sikap') return <NilaiSikapView onNotify={onNotify} />
  if (activeKey === 'capaian-kompetensi') return <CapaianKompetensiView onNotify={onNotify} />
  if (activeKey === 'rekap-nilai-per-kelas') return <RekapNilaiView onNotify={onNotify} />
  if (activeKey === 'validasi-nilai') return <ValidasiNilaiView onNotify={onNotify} />
  return null
}

export default AssessmentSectionViews
