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
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = cocurricularList.flatMap((item) => item.projects
      .filter((project) => project.description?.trim())
      .map((project) => ({
        student_id: item.student_id,
        title: project.title?.trim() || 'Projek Penguatan Profil Pelajar Pancasila (P5)',
        description: project.description.trim(),
      })))

    if (!payload.length) {
      setErrorMessage('Isi deskripsi projek kokurikuler minimal untuk satu siswa.')
      setSaving(false)
      return
    }

    const res = await assessmentService.saveCocurriculars(classId, semesterId, payload)
    setSaving(false)
    if (res.success) {
      setSuccessMessage(res.message || 'Catatan kokurikuler berhasil disimpan.')
      onSaved?.('Kokurikuler berhasil diperbarui')
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 600 }}>
              Kelola Data Pelengkap Rapor
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Input data kehadiran, ekstrakurikuler, kokurikuler, dan catatan wali kelas rombel.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#64748b',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 1.5rem',
            background: '#ffffff',
          }}
        >
          {[
            { key: 'absensi', label: '1. Rekap Ketidakhadiran' },
            { key: 'ekstrakurikuler', label: '2. Ekstrakurikuler' },
            { key: 'kokurikuler', label: '3. Projek Kokurikuler (P5)' },
            { key: 'catatan-wali-kelas', label: '4. Catatan Wali Kelas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCurrentTab(tab.key)
                setErrorMessage('')
                setSuccessMessage('')
              }}
              type="button"
              style={{
                padding: '0.875rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: currentTab === tab.key ? 600 : 400,
                color: currentTab === tab.key ? '#2563eb' : '#64748b',
                border: 'none',
                background: 'none',
                borderBottom: currentTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Banners */}
        {errorMessage && (
          <div style={{ padding: '0.75rem 1.5rem', background: '#fee2e2', color: '#991b1b', fontSize: '0.85rem' }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{ padding: '0.75rem 1.5rem', background: '#dcfce7', color: '#166534', fontSize: '0.85rem' }}>
            <Icon name="checkCircle" /> {successMessage}
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>
              Memuat data siswa dan catatan rombel...
            </p>
          ) : !students.length ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>
              Tidak ada siswa yang terdaftar aktif pada rombel ini.
            </p>
          ) : (
            <>
              {/* TAB 1: ABSENSI */}
              {currentTab === 'absensi' && (
                <div>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Masukkan jumlah hari ketidakhadiran selama satu semester (Sakit, Izin, Tanpa Keterangan).
                    </span>
                    <Button className="report-button primary" disabled={saving} onClick={handleSaveAttendance}>
                      <Icon name="save" />
                      {saving ? 'Menyimpan...' : 'Simpan Presensi'}
                    </Button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.6rem 0.8rem' }}>No</th>
                        <th style={{ padding: '0.6rem 0.8rem' }}>NIS</th>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Nama Siswa</th>
                        <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Sakit (hari)</th>
                        <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Izin (hari)</th>
                        <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Alpa (hari)</th>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.map((item, idx) => (
                        <tr key={item.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.6rem 0.8rem' }}>{idx + 1}</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>{item.nis}</td>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.sick}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'sick', e.target.value)}
                              style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.permitted}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'permitted', e.target.value)}
                              style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.absent}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'absent', e.target.value)}
                              style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => handleAttendanceChange(item.student_id, 'notes', e.target.value)}
                              placeholder="Catatan..."
                              style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: EKSTRAKURIKULER */}
              {currentTab === 'ekstrakurikuler' && (
                <div>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Kelola kegiatan ekstrakurikuler yang diikuti setiap siswa beserta predikat capaian.
                    </span>
                    <Button className="report-button primary" disabled={saving} onClick={handleSaveExtracurriculars}>
                      <Icon name="save" />
                      {saving ? 'Menyimpan...' : 'Simpan Ekstrakurikuler'}
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {extracurricularList.map((item, idx) => (
                      <div
                        key={item.student_id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '1rem',
                          background: '#f8fafc',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>
                            {idx + 1}. {item.name} <small style={{ color: '#64748b' }}>({item.nis})</small>
                          </strong>
                          <button
                            type="button"
                            onClick={() => addExtracurricularActivity(item.student_id)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '0.2rem 0.6rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            + Tambah Ekskul
                          </button>
                        </div>
                        {item.activities.map((act, aIdx) => (
                          <div
                            key={aIdx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.5fr 1fr 2fr',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <input
                              type="text"
                              value={act.activity_name}
                              placeholder="Nama Ekskul (cth: Pramuka, PMR)"
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'activity_name', e.target.value)
                              }
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                            <select
                              value={act.predicate}
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'predicate', e.target.value)
                              }
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            >
                              <option value="Sangat Baik">Sangat Baik</option>
                              <option value="Baik">Baik</option>
                              <option value="Cukup">Cukup</option>
                              <option value="Kurang">Kurang</option>
                            </select>
                            <input
                              type="text"
                              value={act.description}
                              placeholder="Deskripsi / capaian kegiatan..."
                              onChange={(e) =>
                                handleExtracurricularChange(item.student_id, aIdx, 'description', e.target.value)
                              }
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: KOKURIKULER (P5) */}
              {currentTab === 'kokurikuler' && (
                <div>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Catatan perkembangan Projek Penguatan Profil Pelajar Pancasila (P5) siswa.
                    </span>
                    <Button className="report-button primary" disabled={saving} onClick={handleSaveCocurriculars}>
                      <Icon name="save" />
                      {saving ? 'Menyimpan...' : 'Simpan Kokurikuler'}
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {cocurricularList.map((item, idx) => (
                      <div
                        key={item.student_id}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}
                      >
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>{idx + 1}. {item.name}</strong> <small style={{ color: '#64748b' }}>({item.nis})</small>
                        </div>
                        {item.projects.length === 0 && <p>Belum ada projek kokurikuler.</p>}
                        {item.projects.map((project, projectIndex) => (
                          <div key={`${item.student_id}-${projectIndex}`}>
                            <input
                              type="text"
                              value={project.title}
                              onChange={(e) => handleCocurricularChange(item.student_id, projectIndex, 'title', e.target.value)}
                              placeholder="Judul / Tema Projek P5..."
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem', fontSize: '0.85rem' }}
                            />
                            <textarea
                              rows="2"
                              value={project.description}
                              onChange={(e) => handleCocurricularChange(item.student_id, projectIndex, 'description', e.target.value)}
                              placeholder="Deskripsi pencapaian dimensi dan elemen P5 siswa..."
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CATATAN WALI KELAS */}
              {currentTab === 'catatan-wali-kelas' && (
                <div>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Catatan evaluasi, bimbingan, dan motivasi wali kelas yang akan dicantumkan pada buku rapor.
                    </span>
                    <Button className="report-button primary" disabled={saving} onClick={handleSaveHomeroomNotes}>
                      <Icon name="save" />
                      {saving ? 'Menyimpan...' : 'Simpan Catatan'}
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {homeroomNotesList.map((item, idx) => (
                      <div
                        key={item.student_id}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#ffffff' }}
                      >
                        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{idx + 1}. {item.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: item.note ? '#166534' : '#92400e', background: item.note ? '#dcfce7' : '#fef3c7', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                            {item.note ? 'Terisi' : 'Belum Terisi'}
                          </span>
                        </div>
                        <textarea
                          rows="3"
                          value={item.note}
                          onChange={(e) => handleHomeroomNoteChange(item.student_id, e.target.value)}
                          placeholder="Tulis catatan perkembangan dan pesan motivasi untuk siswa..."
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}
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
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button className="report-button secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SupplementaryDataModal
