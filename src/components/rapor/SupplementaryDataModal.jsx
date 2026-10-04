import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'

function SupplementaryDataModal({ isOpen, onClose, activeTab = 'absensi', classId, semesterId, onSaved }) {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form states per tab
  const [attendanceList, setAttendanceList] = useState([])
  const [extracurricularList, setExtracurricularList] = useState([])
  const [cocurricularList, setCocurricularList] = useState([])
  const [homeroomNotesList, setHomeroomNotesList] = useState([])

  const [prevActiveTab, setPrevActiveTab] = useState(activeTab)

  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab)
    setCurrentTab(activeTab)
  }

  useEffect(() => {
    if (!isOpen || !classId || !semesterId) return

    let isMounted = true
    async function fetchData() {
      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      setStudents([])

      const res = await assessmentService.getSupplementaryData(classId, semesterId)
      if (isMounted) {
        if (res.success && res.data?.students) {
          const fetchedStudents = res.data.students
          setStudents(fetchedStudents)

          // 1. Attendance mapping
          setAttendanceList(fetchedStudents.map((s) => ({
            student_id: s.student_id,
            name: s.name,
            nis: s.nis,
            sick: s.attendance?.sick ?? 0,
            permitted: s.attendance?.permitted ?? 0,
            absent: s.attendance?.absent ?? 0,
            notes: s.attendance?.notes ?? '',
          })))

          // 2. Extracurriculars mapping
          setExtracurricularList(fetchedStudents.map((s) => ({
            student_id: s.student_id,
            name: s.name,
            nis: s.nis,
            activities: s.extracurriculars?.length
              ? s.extracurriculars.map((e) => ({
                  activity_name: e.activity_name || '',
                  predicate: e.predicate || 'Baik',
                  description: e.description || '',
                }))
              : [{ activity_name: '', predicate: 'Baik', description: '' }],
          })))

          // 3. Cocurricular mapping
          setCocurricularList(fetchedStudents.map((s) => ({
            student_id: s.student_id,
            name: s.name,
            nis: s.nis,
            projects: (s.cocurriculars ?? []).map((project) => ({
              id: project.id,
              title: project.title || '',
              description: project.description || '',
            })),
          })))

          // 4. Homeroom notes mapping
          setHomeroomNotesList(fetchedStudents.map((s) => ({
            student_id: s.student_id,
            name: s.name,
            nis: s.nis,
            note: s.homeroom_note || '',
          })))
        } else {
          setErrorMessage(res.error || 'Gagal memuat data pelengkap.')
        }
        setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [isOpen, classId, semesterId])

  if (!isOpen) return null

  // Handlers for updating form fields
  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceList((prev) =>
      prev.map((item) =>
        item.student_id === studentId
          ? { ...item, [field]: field === 'notes' ? value : Math.max(0, parseInt(value, 10) || 0) }
          : item
      )
    )
  }

  const handleHomeroomNoteChange = (studentId, note) => {
    setHomeroomNotesList((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, note } : item))
    )
  }

  const handleCocurricularChange = (studentId, projectIndex, field, value) => {
    setCocurricularList((prev) =>
      prev.map((item) => {
        if (item.student_id !== studentId) return item
        const projects = [...item.projects]
        projects[projectIndex] = { ...projects[projectIndex], [field]: value }
        return { ...item, projects }
      })
    )
  }

  const addCocurricularProject = (studentId) => {
    setCocurricularList((current) => current.map((item) => item.student_id === studentId
      ? { ...item, projects: [...item.projects, { title: '', description: '' }] }
      : item))
  }

  const removeCocurricularProject = (studentId, projectIndex) => {
    setCocurricularList((current) => current.map((item) => item.student_id === studentId
      ? { ...item, projects: item.projects.filter((_, index) => index !== projectIndex) }
      : item))
  }

  const handleExtracurricularChange = (studentId, actIndex, field, value) => {
    setExtracurricularList((prev) =>
      prev.map((item) => {
        if (item.student_id !== studentId) return item
        const updatedActivities = [...item.activities]
        updatedActivities[actIndex] = {
          ...updatedActivities[actIndex],
          [field]: value,
        }
        return { ...item, activities: updatedActivities }
      })
    )
  }

  const addExtracurricularActivity = (studentId) => {
    setExtracurricularList((prev) =>
      prev.map((item) =>
        item.student_id === studentId
          ? {
              ...item,
              activities: [...item.activities, { activity_name: '', predicate: 'Baik', description: '' }],
            }
          : item
      )
    )
  }

  const removeExtracurricularActivity = (studentId, activityIndex) => {
    setExtracurricularList((current) => current.map((item) => item.student_id === studentId
      ? { ...item, activities: item.activities.filter((_, index) => index !== activityIndex) }
      : item))
  }

  // Save actions
  const handleSaveAttendance = async () => {
    if (saving) return
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = attendanceList.map((item) => ({
      student_id: item.student_id,
      sick: item.sick,
      permitted: item.permitted,
      absent: item.absent,
      notes: item.notes,
    }))

    const res = await assessmentService.saveAttendance(classId, semesterId, payload)
    setSaving(false)
    if (res.success) {
      setSuccessMessage(res.message || 'Data presensi berhasil disimpan.')
      onSaved?.('Presensi berhasil diperbarui')
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan data presensi.')
    }
  }

  const handleSaveExtracurriculars = async () => {
    if (saving) return
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = extracurricularList.map((item) => ({
      student_id: item.student_id,
      activities: item.activities.filter((a) => a.activity_name?.trim()),
    }))

    const res = await assessmentService.saveExtracurriculars(classId, semesterId, payload)
    setSaving(false)
    if (res.success) {
      setSuccessMessage(res.message || 'Data ekstrakurikuler berhasil disimpan.')
      onSaved?.('Ekstrakurikuler berhasil diperbarui')
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan data ekstrakurikuler.')
    }
  }

  const handleSaveCocurriculars = async () => {
    if (saving) return
    if (cocurricularList.some((item) => item.projects.some((project) => !project.title?.trim() || !project.description?.trim()))) {
      setErrorMessage('Isi judul dan deskripsi untuk setiap projek, atau hapus baris yang kosong.')
      return
    }
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = cocurricularList.map((item) => ({
      student_id: item.student_id,
      projects: item.projects.map((project) => ({
        ...(project.id ? { id: project.id } : {}),
        title: project.title.trim(),
        description: project.description.trim(),
      })),
    }))

    const res = await assessmentService.saveCocurriculars(classId, semesterId, payload)
    setSaving(false)
    if (res.success) {
      setSuccessMessage(res.message || 'Catatan kokurikuler berhasil disimpan.')
      onSaved?.('Kokurikuler berhasil diperbarui')
      const refreshed = await assessmentService.getSupplementaryData(classId, semesterId)
      if (refreshed.success) {
        setCocurricularList(refreshed.data.students.map((student) => ({
          student_id: student.student_id,
          name: student.name,
          nis: student.nis,
          projects: student.cocurriculars.map((project) => ({ id: project.id, title: project.title, description: project.description })),
        })))
      }
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan catatan kokurikuler.')
    }
  }

  const handleSaveHomeroomNotes = async () => {
    if (saving) return
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = homeroomNotesList.map((item) => ({
      student_id: item.student_id,
      note: item.note?.trim() || '',
    }))

    const res = await assessmentService.saveHomeroomNotes(classId, semesterId, payload)
    setSaving(false)
    if (res.success) {
      setSuccessMessage(res.message || 'Catatan wali kelas berhasil disimpan.')
      onSaved?.('Catatan wali kelas berhasil diperbarui')
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan catatan wali kelas.')
    }
  }

  const currentTabSaveConfig = {
    absensi: {
      label: 'Simpan Presensi',
      handler: handleSaveAttendance,
    },
    ekstrakurikuler: {
      label: 'Simpan Ekstrakurikuler',
      handler: handleSaveExtracurriculars,
    },
    kokurikuler: {
      label: 'Simpan Kokurikuler',
      handler: handleSaveCocurriculars,
    },
    'catatan-wali-kelas': {
      label: 'Simpan Catatan',
      handler: handleSaveHomeroomNotes,
    },
  }[currentTab]

  return (
    <div className="report-supplementary-backdrop">
      <div aria-labelledby="report-supplementary-title" aria-modal="true" className="report-supplementary-dialog" role="dialog">
        {/* Header */}
        <div className="report-supplementary-header">
          <span className="report-supplementary-header-icon"><Icon name="report" /></span>
          <div className="report-supplementary-heading">
            <h3 id="report-supplementary-title">Kelola Data Pelengkap Rapor</h3>
            <p>
              Input data kehadiran, ekstrakurikuler, kokurikuler, dan catatan wali kelas rombel.
            </p>
          </div>
          <button aria-label="Tutup jendela" className="report-supplementary-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Navigation Tabs */}
        <div aria-label="Bagian data pelengkap" className="report-supplementary-tabs" role="tablist">
          {[
            { key: 'absensi', label: '1. Ketidakhadiran' },
            { key: 'ekstrakurikuler', label: '2. Ekstrakurikuler' },
            { key: 'kokurikuler', label: '3. Kokurikuler (P5)' },
            { key: 'catatan-wali-kelas', label: '4. Catatan Wali Kelas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCurrentTab(tab.key)
                setErrorMessage('')
                setSuccessMessage('')
              }}
              aria-selected={currentTab === tab.key}
              className={currentTab === tab.key ? 'active' : ''}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Banners */}
        {errorMessage && (
          <div className="report-supplementary-message error" role="alert">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="report-supplementary-message success" role="status">
            <Icon name="checkCircle" /> {successMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="report-supplementary-body">
          {loading ? (
            <p className="report-supplementary-empty">
              Memuat data siswa dan catatan rombel...
            </p>
          ) : !students.length ? (
            <p className="report-supplementary-empty">
              Tidak ada siswa yang terdaftar aktif pada rombel ini.
            </p>
          ) : (
            <>
              {/* TAB 1: ABSENSI */}
              {currentTab === 'absensi' && (
                <div className="report-supplementary-section" role="tabpanel">
                  <div className="report-supplementary-toolbar">
                    <p>
                      Masukkan jumlah hari ketidakhadiran selama satu semester (Sakit, Izin, Tanpa Keterangan).
                    </p>
                  </div>
                  <div className="report-supplementary-table-scroll">
                  <table className="report-supplementary-attendance-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>NIS</th>
                        <th>Nama Siswa</th>
                        <th>Sakit</th>
                        <th>Izin</th>
                        <th>Alpa</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.map((item, idx) => (
                        <tr key={item.student_id}>
                          <td>{idx + 1}</td>
                          <td>{item.nis}</td>
                          <td className="report-supplementary-student-name">{item.name}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.sick}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'sick', e.target.value)}
                              aria-label={`Sakit ${item.name}`}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.permitted}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'permitted', e.target.value)}
                              aria-label={`Izin ${item.name}`}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.absent}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'absent', e.target.value)}
                              aria-label={`Alpa ${item.name}`}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'notes', e.target.value)}
                              placeholder="Catatan..."
                              aria-label={`Keterangan ${item.name}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* TAB 2: EKSTRAKURIKULER */}
              {currentTab === 'ekstrakurikuler' && (
                <div className="report-supplementary-section" role="tabpanel">
                  <div className="report-supplementary-toolbar">
                    <p>
                      Kelola kegiatan ekstrakurikuler yang diikuti setiap siswa beserta predikat capaian.
                    </p>
                  </div>
                  <div className="report-supplementary-student-list">
                    {extracurricularList.map((item, idx) => (
                      <div className="report-supplementary-student-card" key={item.student_id}>
                        <div className="report-supplementary-student-header">
                          <strong><span className="report-supplementary-student-number">{idx + 1}</span>{item.name}<small>{item.nis}</small></strong>
                          <button
                            className="report-supplementary-add"
                            type="button"
                            onClick={() => addExtracurricularActivity(item.student_id)}
                          >
                            + Tambah Ekskul
                          </button>
                        </div>
                        <div className="report-supplementary-entries">
                        {item.activities.map((act, aIdx) => (
                          <div className="report-supplementary-entry-row extracurricular" key={aIdx}>
                            <input
                              aria-label={`Nama ekstrakurikuler ${item.name} baris ${aIdx + 1}`}
                              type="text"
                              value={act.activity_name}
                              placeholder="Nama Ekskul (cth: Pramuka, PMR)"
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'activity_name', e.target.value)
                              }
                            />
                            <select
                              aria-label={`Predikat ekstrakurikuler ${item.name} baris ${aIdx + 1}`}
                              value={act.predicate}
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'predicate', e.target.value)
                              }
                            >
                              <option value="Sangat Baik">Sangat Baik</option>
                              <option value="Baik">Baik</option>
                              <option value="Cukup">Cukup</option>
                              <option value="Kurang">Kurang</option>
                            </select>
                            <input
                              aria-label={`Deskripsi ekstrakurikuler ${item.name} baris ${aIdx + 1}`}
                              type="text"
                              value={act.description}
                              placeholder="Deskripsi / capaian kegiatan..."
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'description', e.target.value)
                              }
                            />
                            <button aria-label={`Hapus ekstrakurikuler ${item.name} baris ${aIdx + 1}`} className="report-supplementary-remove" type="button" onClick={() => removeExtracurricularActivity(item.student_id, aIdx)}>Hapus</button>
                          </div>
                        ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: KOKURIKULER (P5) */}
              {currentTab === 'kokurikuler' && (
                <div className="report-supplementary-section" role="tabpanel">
                  <div className="report-supplementary-toolbar">
                    <p>
                      Catatan perkembangan Projek Penguatan Profil Pelajar Pancasila (P5) siswa.
                    </p>
                  </div>
                  <div className="report-supplementary-student-list">
                    {cocurricularList.map((item, idx) => (
                      <div className="report-supplementary-student-card" key={item.student_id}>
                        <div className="report-supplementary-student-header">
                          <strong><span className="report-supplementary-student-number">{idx + 1}</span>{item.name}<small>{item.nis}</small></strong>
                          <button className="report-supplementary-add" type="button" onClick={() => addCocurricularProject(item.student_id)}>+ Tambah Projek</button>
                        </div>
                        {item.projects.length === 0 && <p className="report-supplementary-empty-card">Belum ada projek kokurikuler untuk siswa ini.</p>}
                        <div className="report-supplementary-entries">
                        {item.projects.map((project, projectIndex) => (
                          <div className="report-supplementary-project" key={`${item.student_id}-${projectIndex}`}>
                            <div className="report-supplementary-project-heading"><span>Projek {projectIndex + 1}</span><button className="report-supplementary-remove" type="button" onClick={() => removeCocurricularProject(item.student_id, projectIndex)}>Hapus Projek</button></div>
                            <input
                              aria-label={`Judul projek ${item.name} nomor ${projectIndex + 1}`}
                              type="text"
                              value={project.title}
                              onChange={(e) => handleCocurricularChange(item.student_id, projectIndex, 'title', e.target.value)}
                              placeholder="Judul / Tema Projek P5..."
                            />
                            <textarea
                              aria-label={`Deskripsi projek ${item.name} nomor ${projectIndex + 1}`}
                              rows="2"
                              value={project.description}
                              onChange={(e) => handleCocurricularChange(item.student_id, projectIndex, 'description', e.target.value)}
                              placeholder="Deskripsi pencapaian dimensi dan elemen P5 siswa..."
                            />
                          </div>
                        ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CATATAN WALI KELAS */}
              {currentTab === 'catatan-wali-kelas' && (
                <div className="report-supplementary-section" role="tabpanel">
                  <div className="report-supplementary-toolbar">
                    <p>
                      Catatan evaluasi, bimbingan, dan motivasi wali kelas yang akan dicantumkan pada buku rapor.
                    </p>
                  </div>
                  <div className="report-supplementary-student-list">
                    {homeroomNotesList.map((item, idx) => (
                      <div className="report-supplementary-student-card" key={item.student_id}>
                        <div className="report-supplementary-student-header">
                          <strong><span className="report-supplementary-student-number">{idx + 1}</span>{item.name}<small>{item.nis}</small></strong>
                          <span className={`report-supplementary-note-status ${item.note ? 'filled' : 'empty'}`}>
                            {item.note ? 'Terisi' : 'Belum Terisi'}
                          </span>
                        </div>
                        <textarea
                          aria-label={`Catatan wali kelas ${item.name}`}
                          rows="3"
                          value={item.note}
                          onChange={(e) => handleHomeroomNoteChange(item.student_id, e.target.value)}
                          placeholder="Tulis catatan perkembangan dan pesan motivasi untuk siswa..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="report-supplementary-footer">
          <Button
            type="button"
            className="report-button secondary report-supplementary-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Tutup
          </Button>
          {currentTabSaveConfig && (
            <Button
              type="button"
              className="report-button primary report-supplementary-btn-save"
              disabled={saving || loading || !students.length}
              onClick={currentTabSaveConfig.handler}
            >
              <Icon name="save" />
              {saving ? 'Menyimpan...' : currentTabSaveConfig.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupplementaryDataModal
