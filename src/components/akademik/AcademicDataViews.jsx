import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  academicOptions,
  roomAssignments,
} from '../../data/akademik.js'
import AcademicModal from './AcademicModal.jsx'
import AcademicSummary from './AcademicSummary.jsx'
import rombelService from '../../services/rombelService.js'
import assignmentService from '../../services/assignmentService.js'
import academicService from '../../services/academicService.js'
import teacherService from '../../services/teacherService.js'

function toStatusClass(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function AcademicSearch({ ariaLabel, onChange, placeholder, value }) {
  return (
    <label className="academic-search">
      <SearchInput aria-label={ariaLabel} onChange={onChange} placeholder={placeholder} value={value} />
      <Icon name="search" />
    </label>
  )
}

function AcademicField({ label, onChange, options, value, disabled = false }) {
  return (
    <label className="academic-field">
      <span>{label}</span>
      <select disabled={disabled} onChange={onChange} value={value}>
        {options.map((option) => {
          const val = typeof option === 'object' ? option.value : option
          const lbl = typeof option === 'object' ? option.label : option
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
    </label>
  )
}

function PaginationFooter({ itemLabel, pagination, totalItems }) {
  return (
    <MasterPagination
      currentPage={pagination.currentPage}
      itemLabel={itemLabel}
      onPageChange={pagination.setCurrentPage}
      onRowsPerPageChange={pagination.setRowsPerPage}
      rowsPerPage={pagination.rowsPerPage}
      totalItems={totalItems}
      totalPages={pagination.totalPages}
    />
  )
}

// =============================================================================
// 1. ACADEMIC ROMBEL VIEW (Keanggotaan Rombel per Semester)
// =============================================================================
export function AcademicRombelView({ onNotify }) {
  const [years, setYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [classes, setClasses] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('X')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState(null)

  // Modals state
  const [addOpen, setAddOpen] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
  const [addNotes, setAddNotes] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Transfer modal
  const [transferTarget, setTransferTarget] = useState(null)
  const [targetClassId, setTargetClassId] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [transferReason, setTransferReason] = useState('')

  // Sync modal
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncPreview, setSyncPreview] = useState(null)
  const [syncLoading, setSyncLoading] = useState(false)

  // 1. Fetch reference data
  useEffect(() => {
    let mounted = true
    async function loadRefs() {
      try {
        const [yrRes, semRes, clsRes] = await Promise.all([
          academicService.getAcademicYears({ per_page: 50 }),
          academicService.getSemesters({ per_page: 50 }),
          academicService.getClasses({ per_page: 100 }),
        ])

        if (!mounted) return
        const yrList = yrRes.success ? yrRes.data : []
        const semList = semRes.success ? semRes.data : []
        const clsList = clsRes.success ? clsRes.data : []

        setYears(yrList)
        setSemesters(semList)
        setClasses(clsList)

        // Select defaults
        const activeYr = yrList.find((y) => y.status === 'Aktif') || yrList[0]
        if (activeYr) {
          setSelectedYearId(String(activeYr.id))
          const activeSem = semList.find((s) => s.academic_year_id === activeYr.id && s.status === 'Aktif')
            || semList.find((s) => s.academic_year_id === activeYr.id)
            || semList[0]
          if (activeSem) setSelectedSemesterId(String(activeSem.id))

          const firstClass = clsList.find((c) => c.academic_year_id === activeYr.id && c.grade === 'X')
            || clsList.find((c) => c.grade === 'X')
            || clsList[0]
          if (firstClass) setSelectedClassId(String(firstClass.id))
        }
      } catch (err) {
        console.error('Failed to load academic refs', err)
      } finally {
        if (mounted) setLoadingRefs(false)
      }
    }
    loadRefs()
    return () => { mounted = false }
  }, [])

  // Filtered lists for dropdowns
  const availableSemesters = useMemo(() => {
    if (!selectedYearId) return semesters
    return semesters.filter((s) => String(s.academic_year_id) === String(selectedYearId))
  }, [semesters, selectedYearId])

  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchYear = !selectedYearId || String(c.academic_year_id) === String(selectedYearId)
      const matchGrade = !selectedGrade || c.grade === selectedGrade
      return matchYear && matchGrade
    })
  }, [classes, selectedYearId, selectedGrade])

  const selectedClassObj = useMemo(() => {
    return classes.find((c) => String(c.id) === String(selectedClassId))
  }, [classes, selectedClassId])

  // 2. Fetch Members & Stats
  const loadMembers = useCallback(async () => {
    if (!selectedClassId || !selectedSemesterId) return
    setLoadingMembers(true)
    try {
      const [res, statsRes] = await Promise.all([
        rombelService.getMembers({
          class_id: selectedClassId,
          semester_id: selectedSemesterId,
          search: searchQuery,
          page: currentPage,
          per_page: rowsPerPage,
        }),
        rombelService.getStats({
          academic_year_id: selectedYearId,
          semester_id: selectedSemesterId,
        }),
      ])

      if (res.success) {
        setMembers(res.data)
        setTotalItems(res.meta?.total || res.data.length)
      } else {
        setMembers([])
        setTotalItems(0)
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }
    } catch (err) {
      console.error('Error fetching rombel members:', err)
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }, [selectedClassId, selectedSemesterId, selectedYearId, searchQuery, currentPage, rowsPerPage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMembers(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadMembers])

  // Open Add Student Modal
  const handleOpenAdd = async () => {
    setModalError('')
    setSelectedStudentId('')
    setAddNotes('')
    setAddOpen(true)
    try {
      const res = await rombelService.getAvailableStudents({
        semester_id: selectedSemesterId,
        limit: 100,
      })
      if (res.success) {
        setAvailableStudents(res.data)
      }
    } catch (err) {
      console.error('Error fetching available students:', err)
    }
  }

  // Submit Add Student
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStudentId) {
      setModalError('Pilih siswa yang akan didaftarkan.')
      return
    }
    setModalSubmitting(true)
    setModalError('')

    const res = await rombelService.enrollMembers({
      semester_id: Number(selectedSemesterId),
      class_id: Number(selectedClassId),
      student_ids: [Number(selectedStudentId)],
      join_date: joinDate,
      notes: addNotes,
    })

    setModalSubmitting(false)
    if (res.success) {
      setAddOpen(false)
      onNotify(res.message || 'Siswa berhasil ditambahkan ke rombel.')
      loadMembers()
    } else {
      setModalError(res.message || 'Gagal mendaftarkan siswa.')
    }
  }

  // Open Transfer Modal
  const handleOpenTransfer = (member) => {
    setTransferTarget(member)
    setTargetClassId('')
    setTransferDate(new Date().toISOString().split('T')[0])
    setTransferReason('')
    setModalError('')
  }

  // Submit Transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    if (!targetClassId) {
      setModalError('Pilih rombel tujuan mutasi.')
      return
    }
    if (String(targetClassId) === String(selectedClassId)) {
      setModalError('Rombel tujuan tidak boleh sama dengan rombel asal.')
      return
    }

    setModalSubmitting(true)
    setModalError('')

    const res = await rombelService.transferMember(transferTarget.id, {
      target_class_id: Number(targetClassId),
      transfer_date: transferDate,
      reason: transferReason,
    })

    setModalSubmitting(false)
    if (res.success) {
      setTransferTarget(null)
      onNotify(res.message || 'Siswa berhasil dimutasi ke rombel tujuan.')
      loadMembers()
    } else {
      setModalError(res.message || 'Gagal memutasi siswa.')
    }
  }

  // Remove member
  const handleRemoveMember = async (member) => {
    const studentName = member.student?.name || 'Siswa'
    if (!window.confirm(`Yakin ingin mengeluarkan ${studentName} dari rombel ini?`)) {
      return
    }
    const res = await rombelService.removeMember(member.id)
    if (res.success) {
      onNotify(res.message || `${studentName} berhasil dikeluarkan dari rombel.`)
      loadMembers()
    } else {
      alert(res.message || 'Gagal mengeluarkan siswa.')
    }
  }

  // Open Sync Preview
  const handleOpenSync = async () => {
    setSyncOpen(true)
    setSyncLoading(true)
    try {
      const res = await rombelService.getSyncPreview(selectedSemesterId)
      if (res.success) {
        setSyncPreview(res.data)
      } else {
        setSyncPreview(null)
      }
    } catch (err) {
      console.error('Error loading sync preview:', err)
    } finally {
      setSyncLoading(false)
    }
  }

  // Commit Sync
  const handleCommitSync = async () => {
    setSyncLoading(true)
    try {
      const res = await rombelService.commitSync(selectedSemesterId)
      if (res.success) {
        setSyncOpen(false)
        onNotify(res.message || 'Sinkronisasi rombel ke data siswa berhasil.')
        loadMembers()
      } else {
        alert(res.message || 'Gagal mengeksekusi sinkronisasi.')
      }
    } catch (err) {
      console.error('Error executing sync:', err)
      alert('Terjadi kesalahan saat sinkronisasi.')
    } finally {
      setSyncLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const pagination = {
    currentPage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage: (val) => { setRowsPerPage(val); setCurrentPage(1) },
  }

  return (
    <>
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid four-fields">
            <AcademicField
              disabled={loadingRefs}
              label="Tahun Ajaran"
              onChange={(e) => {
                setSelectedYearId(e.target.value)
                setCurrentPage(1)
              }}
              options={years.map((y) => ({ value: String(y.id), label: `${y.name} (${y.status})` }))}
              value={selectedYearId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Semester"
              onChange={(e) => {
                setSelectedSemesterId(e.target.value)
                setCurrentPage(1)
              }}
              options={availableSemesters.map((s) => ({ value: String(s.id), label: `${s.name} (${s.status})` }))}
              value={selectedSemesterId}
            />
            <AcademicField
              label="Tingkat"
              onChange={(e) => {
                setSelectedGrade(e.target.value)
                const matched = classes.find((c) => String(c.academic_year_id) === String(selectedYearId) && c.grade === e.target.value)
                if (matched) setSelectedClassId(String(matched.id))
                setCurrentPage(1)
              }}
              options={['X', 'XI', 'XII']}
              value={selectedGrade}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Kelas / Rombel"
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setCurrentPage(1)
              }}
              options={availableClasses.map((c) => ({ value: String(c.id), label: `${c.name} (Kapasitas: ${c.capacity})` }))}
              value={selectedClassId}
            />
          </div>
          <AcademicSearch
            ariaLabel="Cari siswa"
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Cari siswa (NIS/Nama)..."
            value={searchQuery}
          />
        </div>

        <div className="academic-actions">
          <div className="academic-context-title">
            <span><Icon name="users" /></span>
            <div>
              <h3>{selectedClassObj ? selectedClassObj.name : 'Rombongan Belajar'}</h3>
              <p>
                {stats?.total_members ?? totalItems} Siswa Terdaftar &middot; Kapasitas: {selectedClassObj?.capacity ?? 36}
                {stats?.remaining_capacity !== undefined && ` (Sisa: ${stats.remaining_capacity})`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button className="academic-button secondary" onClick={handleOpenSync} type="button">
              <Icon name="refresh" /> Sinkronkan Data Siswa
            </Button>
            <Button className="academic-button primary" onClick={handleOpenAdd} type="button">
              <Icon name="plus" /> Tambah Siswa ke Rombel
            </Button>
          </div>
        </div>

        <div className="academic-table-scroll">
          <table className="academic-table academic-rombel-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>JK</th>
                <th>Tgl Masuk</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingMembers ? (
                <tr>
                  <td className="academic-empty-row" colSpan="8">
                    <span>Memuat data anggota rombel...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td className="academic-empty-row" colSpan="8">
                    <Icon name="search" />
                    <strong>Data siswa tidak ditemukan</strong>
                    <span>Belum ada siswa terdaftar di rombel ini atau hasil pencarian nihil.</span>
                  </td>
                </tr>
              ) : members.map((member, index) => {
                const s = member.student || {}
                const genderCode = s.gender === 'L' || s.gender === 'Laki-laki' ? 'L' : 'P'
                return (
                  <tr key={member.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>{s.nis || '-'}</td>
                    <td>{s.nisn || '-'}</td>
                    <td className="academic-name-cell">
                      <strong>{s.name}</strong>
                      {member.notes && <small style={{ display: 'block', color: '#64748b' }}>{member.notes}</small>}
                    </td>
                    <td>
                      <span className={`academic-gender ${genderCode === 'P' ? 'female' : 'male'}`}>
                        {genderCode}
                      </span>
                    </td>
                    <td>{member.join_date ? member.join_date.substring(0, 10) : '-'}</td>
                    <td>
                      <span className={`academic-status ${toStatusClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <div className="academic-row-actions">
                        <button
                          aria-label={`Mutasi ${s.name}`}
                          onClick={() => handleOpenTransfer(member)}
                          title="Mutasi / Pindah Rombel"
                          type="button"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          aria-label={`Keluarkan ${s.name}`}
                          onClick={() => handleRemoveMember(member)}
                          title="Keluarkan dari Rombel"
                          type="button"
                        >
                          <Icon name="reset" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationFooter itemLabel="siswa" pagination={pagination} totalItems={totalItems} />
      </section>

      {/* MODAL 1: TAMBAH SISWA KE ROMBEL */}
      {addOpen && (
        <AcademicModal
          description={`Pilih siswa aktif yang belum terdaftar di semester ini untuk dimasukkan ke ${selectedClassObj?.name}.`}
          onClose={() => setAddOpen(false)}
          title="Tambah Anggota Rombel"
        >
          <form className="academic-entity-form" onSubmit={handleAddSubmit}>
            <div className="academic-form-grid">
              <label className="full-width">
                <span>Pilih Siswa (Belum Terdaftar di Semester Ini)<b>*</b></span>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Pilih Siswa --</option>
                  {availableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nis} - {st.name} ({st.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tanggal Masuk<b>*</b></span>
                <input
                  required
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                />
              </label>
              <label>
                <span>Catatan</span>
                <input
                  placeholder="Keterangan tambahan..."
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                />
              </label>
            </div>
            {modalError && (
              <div className="academic-conflict-alert" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                <Icon name="info" />
                <span>{modalError}</span>
              </div>
            )}
            <footer>
              <Button className="academic-button secondary" onClick={() => setAddOpen(false)} type="button">
                Batal
              </Button>
              <Button className="academic-button primary" disabled={modalSubmitting} type="submit">
                <Icon name="save" /> {modalSubmitting ? 'Menyimpan...' : 'Daftarkan Siswa'}
              </Button>
            </footer>
          </form>
        </AcademicModal>
      )}

      {/* MODAL 2: MUTASI SISWA */}
      {transferTarget && (
        <AcademicModal
          description={`Pindahkan siswa ${transferTarget.student?.name} dari ${selectedClassObj?.name} ke rombel lain pada semester yang sama.`}
          onClose={() => setTransferTarget(null)}
          title="Mutasi / Pindah Rombel Siswa"
        >
          <form className="academic-entity-form" onSubmit={handleTransferSubmit}>
            <div className="academic-form-grid">
              <label className="full-width">
                <span>Rombel Tujuan<b>*</b></span>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                >
                  <option value="">-- Pilih Rombel Tujuan --</option>
                  {classes
                    .filter((c) => String(c.id) !== String(selectedClassId) && String(c.academic_year_id) === String(selectedYearId))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade} - Kapasitas: {c.capacity})
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Tanggal Mutasi<b>*</b></span>
                <input
                  required
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </label>
              <label>
                <span>Alasan Mutasi</span>
                <input
                  placeholder="Contoh: Pindah peminatan / rekomendasi BK"
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </label>
            </div>
            {modalError && (
              <div className="academic-conflict-alert" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                <Icon name="info" />
                <span>{modalError}</span>
              </div>
            )}
            <footer>
              <Button className="academic-button secondary" onClick={() => setTransferTarget(null)} type="button">
                Batal
              </Button>
              <Button className="academic-button primary" disabled={modalSubmitting} type="submit">
                <Icon name="save" /> {modalSubmitting ? 'Memproses...' : 'Konfirmasi Mutasi'}
              </Button>
            </footer>
          </form>
        </AcademicModal>
      )}

      {/* MODAL 3: SINKRONISASI DATA SISWA PREVIEW */}
      {syncOpen && (
        <AcademicModal
          description="Sinkronisasi memperbarui kolom 'current_class_name' pada Data Siswa sesuai rombel aktif semester ini."
          onClose={() => setSyncOpen(false)}
          title="Sinkronisasi Rombel ke Data Siswa"
          wide
        >
          <div style={{ padding: '4px 0 16px' }}>
            {syncLoading ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                Memeriksa status sinkronisasi rombel...
              </p>
            ) : syncPreview ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Terdaftar</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '20px', color: '#0f172a' }}>{syncPreview.total_members}</h4>
                  </div>
                  <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Sudah Sinkron</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '20px', color: '#15803d' }}>{syncPreview.in_sync}</h4>
                  </div>
                  <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>Perlu Diperbarui</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '20px', color: '#b45309' }}>{syncPreview.out_of_sync}</h4>
                  </div>
                </div>

                {syncPreview.out_of_sync > 0 ? (
                  <div>
                    <p style={{ fontSize: '13px', color: '#334155', fontWeight: 600, marginBottom: '8px' }}>
                      Daftar Siswa yang Akan Diperbarui:
                    </p>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <table className="academic-table" style={{ margin: 0, fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>NIS</th>
                            <th>Nama Siswa</th>
                            <th>Kelas Lama</th>
                            <th>Kelas Baru (Rombel)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syncPreview.students_to_update?.map((row) => (
                            <tr key={row.student_id}>
                              <td>{row.nis}</td>
                              <td>{row.name}</td>
                              <td style={{ color: '#dc2626' }}>{row.current_class || 'Belum Ada'}</td>
                              <td style={{ color: '#16a34a', fontWeight: 600 }}>{row.new_class}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#16a34a', fontWeight: 600, textAlign: 'center', padding: '16px 0' }}>
                    Semua data siswa sudah sinkron dengan rombel semester aktif!
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#ef4444', textAlign: 'center' }}>Gagal memuat pratinjau sinkronisasi.</p>
            )}
          </div>
          <footer>
            <Button className="academic-button secondary" onClick={() => setSyncOpen(false)} type="button">
              Tutup
            </Button>
            {syncPreview?.out_of_sync > 0 && (
              <Button
                className="academic-button primary"
                disabled={syncLoading}
                onClick={handleCommitSync}
                type="button"
              >
                <Icon name="refresh" /> {syncLoading ? 'Memproses...' : 'Eksekusi Sinkronisasi'}
              </Button>
            )}
          </footer>
        </AcademicModal>
      )}
    </>
  )
}

// =============================================================================
// 2. ACADEMIC HOMEROOM VIEW (Penugasan Wali Kelas per Semester)
// =============================================================================
export function AcademicHomeroomView({ onNotify }) {
  const [years, setYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('Semua Tingkat')
  const [selectedClassId, setSelectedClassId] = useState('Semua Kelas')
  const [searchQuery, setSearchQuery] = useState('')

  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState(null)

  const [modal, setModal] = useState(null) // { type: 'add' | 'edit', item?: object }
  const [formClassId, setFormClassId] = useState('')
  const [formTeacherId, setFormTeacherId] = useState('')
  const [formSkNumber, setFormSkNumber] = useState('')
  const [formStatus, setFormStatus] = useState('Aktif')
  const [formNotes, setFormNotes] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // 1. Fetch Refs
  useEffect(() => {
    let mounted = true
    async function loadRefs() {
      try {
        const [yrRes, semRes, clsRes, tchRes] = await Promise.all([
          academicService.getAcademicYears({ per_page: 50 }),
          academicService.getSemesters({ per_page: 50 }),
          academicService.getClasses({ per_page: 100 }),
          teacherService.getTeachers({ per_page: 200, status: 'Aktif' }),
        ])

        if (!mounted) return
        const yrList = yrRes.success ? yrRes.data : []
        const semList = semRes.success ? semRes.data : []
        const clsList = clsRes.success ? clsRes.data : []
        const tchList = tchRes.success ? tchRes.data : []

        setYears(yrList)
        setSemesters(semList)
        setClasses(clsList)
        setTeachers(tchList)

        const activeYr = yrList.find((y) => y.status === 'Aktif') || yrList[0]
        if (activeYr) {
          setSelectedYearId(String(activeYr.id))
          const activeSem = semList.find((s) => s.academic_year_id === activeYr.id && s.status === 'Aktif')
            || semList.find((s) => s.academic_year_id === activeYr.id)
            || semList[0]
          if (activeSem) setSelectedSemesterId(String(activeSem.id))
        }
      } catch (err) {
        console.error('Failed to load homeroom refs', err)
      } finally {
        if (mounted) setLoadingRefs(false)
      }
    }
    loadRefs()
    return () => { mounted = false }
  }, [])

  const availableSemesters = useMemo(() => {
    if (!selectedYearId) return semesters
    return semesters.filter((s) => String(s.academic_year_id) === String(selectedYearId))
  }, [semesters, selectedYearId])

  const availableClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchYear = !selectedYearId || String(c.academic_year_id) === String(selectedYearId)
      const matchGrade = selectedGrade === 'Semua Tingkat' || c.grade === selectedGrade
      return matchYear && matchGrade
    })
  }, [classes, selectedYearId, selectedGrade])

  // 2. Fetch Homerooms & Stats
  const loadHomerooms = useCallback(async () => {
    if (!selectedSemesterId) return
    setLoadingAssignments(true)
    try {
      const params = {
        semester_id: selectedSemesterId,
        search: searchQuery,
        page: currentPage,
        per_page: rowsPerPage,
      }
      if (selectedYearId) params.academic_year_id = selectedYearId
      if (selectedClassId && selectedClassId !== 'Semua Kelas') params.class_id = selectedClassId

      const [res, statsRes] = await Promise.all([
        assignmentService.getHomerooms(params),
        assignmentService.getHomeroomStats({
          academic_year_id: selectedYearId,
          semester_id: selectedSemesterId,
        }),
      ])

      if (res.success) {
        setAssignments(res.data)
        setTotalItems(res.meta?.total || res.data.length)
      } else {
        setAssignments([])
        setTotalItems(0)
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }
    } catch (err) {
      console.error('Error fetching homerooms:', err)
      setAssignments([])
    } finally {
      setLoadingAssignments(false)
    }
  }, [selectedSemesterId, selectedYearId, selectedClassId, searchQuery, currentPage, rowsPerPage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadHomerooms(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadHomerooms])

  // Open Modal Add / Edit
  const openModal = (type, item = null) => {
    setModal({ type, item })
    setModalError('')
    if (type === 'edit' && item) {
      setFormClassId(String(item.class_id))
      setFormTeacherId(String(item.teacher_id))
      setFormSkNumber(item.sk_number || '')
      setFormStatus(item.status || 'Aktif')
      setFormNotes(item.notes || '')
    } else {
      setFormClassId(availableClasses[0]?.id ? String(availableClasses[0].id) : '')
      setFormTeacherId(teachers[0]?.id ? String(teachers[0].id) : '')
      setFormSkNumber('')
      setFormStatus('Aktif')
      setFormNotes('')
    }
  }

  // Submit Modal
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalSubmitting(true)
    setModalError('')

    if (modal.type === 'add') {
      const res = await assignmentService.assignHomeroom({
        academic_year_id: Number(selectedYearId),
        semester_id: Number(selectedSemesterId),
        class_id: Number(formClassId),
        teacher_id: Number(formTeacherId),
        sk_number: formSkNumber,
        notes: formNotes,
      })

      setModalSubmitting(false)
      if (res.success) {
        setModal(null)
        onNotify(res.message || 'Wali kelas berhasil ditugaskan.')
        loadHomerooms()
      } else {
        setModalError(res.message || 'Gagal menugaskan wali kelas.')
      }
    } else {
      const res = await assignmentService.updateHomeroom(modal.item.id, {
        teacher_id: Number(formTeacherId),
        sk_number: formSkNumber,
        status: formStatus,
        notes: formNotes,
      })

      setModalSubmitting(false)
      if (res.success) {
        setModal(null)
        onNotify(res.message || 'Penugasan wali kelas berhasil diperbarui.')
        loadHomerooms()
      } else {
        setModalError(res.message || 'Gagal memperbarui wali kelas.')
      }
    }
  }

  // Delete Homeroom
  const handleDeleteHomeroom = async (item) => {
    const className = item.school_class?.name || 'Kelas'
    const teacherName = item.teacher?.name || 'Guru'
    if (!window.confirm(`Hapus penugasan wali kelas ${teacherName} untuk ${className}?`)) {
      return
    }
    const res = await assignmentService.deleteHomeroom(item.id)
    if (res.success) {
      onNotify(res.message || 'Penugasan wali kelas berhasil dihapus.')
      loadHomerooms()
    } else {
      alert(res.message || 'Gagal menghapus penugasan wali kelas.')
    }
  }

  const summary = [
    { title: 'Total Kelas', value: stats?.total_classes ?? classes.length, caption: 'Rombongan belajar', icon: 'academic', tone: 'blue' },
    { title: 'Sudah Berwali', value: stats?.assigned_classes ?? assignments.length, caption: 'Memiliki wali kelas', icon: 'checkCircle', tone: 'green' },
    { title: 'Belum Berwali', value: stats?.unassigned_classes ?? 0, caption: 'Perlu penugasan', icon: 'clock', tone: 'orange' },
    { title: 'Guru Wali Kelas', value: stats?.total_teachers ?? new Set(assignments.map((a) => a.teacher_id)).size, caption: 'Guru bertugas', icon: 'users', tone: 'purple' },
  ]

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const pagination = {
    currentPage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage: (val) => { setRowsPerPage(val); setCurrentPage(1) },
  }

  return (
    <>
      <AcademicSummary items={summary} />
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid four-fields">
            <AcademicField
              disabled={loadingRefs}
              label="Tahun Ajaran"
              onChange={(e) => { setSelectedYearId(e.target.value); setCurrentPage(1) }}
              options={years.map((y) => ({ value: String(y.id), label: `${y.name} (${y.status})` }))}
              value={selectedYearId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Semester"
              onChange={(e) => { setSelectedSemesterId(e.target.value); setCurrentPage(1) }}
              options={availableSemesters.map((s) => ({ value: String(s.id), label: `${s.name} (${s.status})` }))}
              value={selectedSemesterId}
            />
            <AcademicField
              label="Tingkat"
              onChange={(e) => { setSelectedGrade(e.target.value); setCurrentPage(1) }}
              options={['Semua Tingkat', 'X', 'XI', 'XII']}
              value={selectedGrade}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Kelas"
              onChange={(e) => { setSelectedClassId(e.target.value); setCurrentPage(1) }}
              options={[{ value: 'Semua Kelas', label: 'Semua Kelas' }, ...availableClasses.map((c) => ({ value: String(c.id), label: c.name }))]}
              value={selectedClassId}
            />
          </div>
          <AcademicSearch
            ariaLabel="Cari kelas atau wali kelas"
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Cari kelas / wali kelas..."
            value={searchQuery}
          />
        </div>

        <div className="academic-actions">
          <div>
            <h3>Penugasan Wali Kelas</h3>
            <p>Satu kelas hanya memiliki 1 wali kelas aktif per semester</p>
          </div>
          <Button className="academic-button primary" onClick={() => openModal('add')} type="button">
            <Icon name="plus" /> Atur Wali Kelas
          </Button>
        </div>

        <div className="academic-table-scroll">
          <table className="academic-table academic-homeroom-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kelas</th>
                <th>Wali Kelas</th>
                <th>NIP</th>
                <th>No. SK</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingAssignments ? (
                <tr>
                  <td className="academic-empty-row" colSpan="7">
                    <span>Memuat penugasan wali kelas...</span>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td className="academic-empty-row" colSpan="7">
                    <Icon name="search" />
                    <strong>Penugasan tidak ditemukan</strong>
                    <span>Belum ada penugasan wali kelas untuk filter yang dipilih.</span>
                  </td>
                </tr>
              ) : assignments.map((item, index) => {
                const cls = item.school_class || {}
                const tch = item.teacher || {}
                return (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="academic-name-cell">
                      <strong>{cls.name}</strong>
                      <small style={{ display: 'block', color: '#64748b' }}>Tingkat {cls.grade}</small>
                    </td>
                    <td><strong>{tch.name}</strong></td>
                    <td>{tch.nip || '-'}</td>
                    <td>{item.sk_number || '-'}</td>
                    <td>
                      <span className={`academic-status ${toStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="academic-row-actions">
                        <button
                          aria-label={`Edit wali kelas ${cls.name}`}
                          onClick={() => openModal('edit', item)}
                          title="Edit Penugasan"
                          type="button"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          aria-label={`Hapus wali kelas ${cls.name}`}
                          onClick={() => handleDeleteHomeroom(item)}
                          title="Hapus Penugasan"
                          type="button"
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationFooter itemLabel="penugasan" pagination={pagination} totalItems={totalItems} />
      </section>

      {/* MODAL TAMBAH / EDIT WALI KELAS */}
      {modal && (
        <AcademicModal
          description="Aturan bisnis: Satu kelas hanya 1 wali kelas aktif, dan 1 guru tidak boleh merangkap wali kelas pada semester yang sama."
          onClose={() => setModal(null)}
          title={`${modal.type === 'edit' ? 'Edit' : 'Atur'} Wali Kelas`}
        >
          <form className="academic-entity-form" onSubmit={handleModalSubmit}>
            <div className="academic-form-grid">
              <label>
                <span>Kelas / Rombel<b>*</b></span>
                <select
                  disabled={modal.type === 'edit'}
                  required
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Guru Wali Kelas<b>*</b></span>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.nip ? `(${t.nip})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Nomor SK Tugas</span>
                <input
                  placeholder="Contoh: SK/2024/001"
                  type="text"
                  value={formSkNumber}
                  onChange={(e) => setFormSkNumber(e.target.value)}
                />
              </label>
              {modal.type === 'edit' ? (
                <label>
                  <span>Status Penugasan<b>*</b></span>
                  <select
                    required
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Digantikan">Digantikan</option>
                  </select>
                </label>
              ) : (
                <label>
                  <span>Catatan</span>
                  <input
                    placeholder="Catatan penugasan..."
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </label>
              )}
            </div>
            {modalError && (
              <div className="academic-conflict-alert" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                <Icon name="info" />
                <span>{modalError}</span>
              </div>
            )}
            <footer>
              <Button className="academic-button secondary" onClick={() => setModal(null)} type="button">
                Batal
              </Button>
              <Button className="academic-button primary" disabled={modalSubmitting} type="submit">
                <Icon name="save" /> {modalSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}
              </Button>
            </footer>
          </form>
        </AcademicModal>
      )}
    </>
  )
}

// =============================================================================
// 3. ACADEMIC TEACHER ASSIGNMENT VIEW (Penugasan Mengajar Guru per Mapel & Rombel)
// =============================================================================
export function AcademicTeacherAssignmentView({ onNotify }) {
  const [years, setYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('Semua Kelas')
  const [selectedSubjectId, setSelectedSubjectId] = useState('Semua Mata Pelajaran')
  const [selectedTeacherId, setSelectedTeacherId] = useState('Semua Guru')
  const [searchQuery, setSearchQuery] = useState('')

  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState(null)

  const [modal, setModal] = useState(null)
  const [formTeacherId, setFormTeacherId] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formWeeklyHours, setFormWeeklyHours] = useState(2)
  const [formRole, setFormRole] = useState('Utama')
  const [formStatus, setFormStatus] = useState('Aktif')
  const [formNotes, setFormNotes] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // 1. Fetch Refs
  useEffect(() => {
    let mounted = true
    async function loadRefs() {
      try {
        const [yrRes, semRes, clsRes, sbjRes, tchRes] = await Promise.all([
          academicService.getAcademicYears({ per_page: 50 }),
          academicService.getSemesters({ per_page: 50 }),
          academicService.getClasses({ per_page: 100 }),
          academicService.getSubjects({ per_page: 200 }),
          teacherService.getTeachers({ per_page: 200, status: 'Aktif' }),
        ])

        if (!mounted) return
        const yrList = yrRes.success ? yrRes.data : []
        const semList = semRes.success ? semRes.data : []
        const clsList = clsRes.success ? clsRes.data : []
        const sbjList = sbjRes.success ? sbjRes.data : []
        const tchList = tchRes.success ? tchRes.data : []

        setYears(yrList)
        setSemesters(semList)
        setClasses(clsList)
        setSubjects(sbjList)
        setTeachers(tchList)

        const activeYr = yrList.find((y) => y.status === 'Aktif') || yrList[0]
        if (activeYr) {
          setSelectedYearId(String(activeYr.id))
          const activeSem = semList.find((s) => s.academic_year_id === activeYr.id && s.status === 'Aktif')
            || semList.find((s) => s.academic_year_id === activeYr.id)
            || semList[0]
          if (activeSem) setSelectedSemesterId(String(activeSem.id))
        }
      } catch (err) {
        console.error('Failed to load course assignment refs', err)
      } finally {
        if (mounted) setLoadingRefs(false)
      }
    }
    loadRefs()
    return () => { mounted = false }
  }, [])

  const availableSemesters = useMemo(() => {
    if (!selectedYearId) return semesters
    return semesters.filter((s) => String(s.academic_year_id) === String(selectedYearId))
  }, [semesters, selectedYearId])

  const availableClasses = useMemo(() => {
    if (!selectedYearId) return classes
    return classes.filter((c) => String(c.academic_year_id) === String(selectedYearId))
  }, [classes, selectedYearId])

  // 2. Fetch Assignments & Stats
  const loadCourseAssignments = useCallback(async () => {
    if (!selectedSemesterId) return
    setLoadingAssignments(true)
    try {
      const params = {
        semester_id: selectedSemesterId,
        search: searchQuery,
        page: currentPage,
        per_page: rowsPerPage,
      }
      if (selectedYearId) params.academic_year_id = selectedYearId
      if (selectedClassId && selectedClassId !== 'Semua Kelas') params.class_id = selectedClassId
      if (selectedSubjectId && selectedSubjectId !== 'Semua Mata Pelajaran') params.subject_id = selectedSubjectId
      if (selectedTeacherId && selectedTeacherId !== 'Semua Guru') params.teacher_id = selectedTeacherId

      const [res, statsRes] = await Promise.all([
        assignmentService.getCourseAssignments(params),
        assignmentService.getCourseAssignmentStats({
          academic_year_id: selectedYearId,
          semester_id: selectedSemesterId,
        }),
      ])

      if (res.success) {
        setAssignments(res.data)
        setTotalItems(res.meta?.total || res.data.length)
      } else {
        setAssignments([])
        setTotalItems(0)
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }
    } catch (err) {
      console.error('Error fetching course assignments:', err)
      setAssignments([])
    } finally {
      setLoadingAssignments(false)
    }
  }, [selectedSemesterId, selectedYearId, selectedClassId, selectedSubjectId, selectedTeacherId, searchQuery, currentPage, rowsPerPage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadCourseAssignments(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadCourseAssignments])

  // Open Modal
  const openModal = (type, item = null) => {
    setModal({ type, item })
    setModalError('')
    if (type === 'edit' && item) {
      setFormTeacherId(String(item.teacher_id))
      setFormSubjectId(String(item.subject_id))
      setFormClassId(String(item.class_id))
      setFormWeeklyHours(item.weekly_hours || 2)
      setFormRole(item.role || 'Utama')
      setFormStatus(item.status || 'Aktif')
      setFormNotes(item.notes || '')
    } else {
      setFormTeacherId(teachers[0]?.id ? String(teachers[0].id) : '')
      setFormSubjectId(subjects[0]?.id ? String(subjects[0].id) : '')
      setFormClassId(availableClasses[0]?.id ? String(availableClasses[0].id) : '')
      setFormWeeklyHours(2)
      setFormRole('Utama')
      setFormStatus('Aktif')
      setFormNotes('')
    }
  }

  // Submit Modal
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalSubmitting(true)
    setModalError('')

    if (modal.type === 'add') {
      const res = await assignmentService.assignCourse({
        academic_year_id: Number(selectedYearId),
        semester_id: Number(selectedSemesterId),
        class_id: Number(formClassId),
        subject_id: Number(formSubjectId),
        teacher_id: Number(formTeacherId),
        weekly_hours: Number(formWeeklyHours),
        role: formRole,
        notes: formNotes,
      })

      setModalSubmitting(false)
      if (res.success) {
        setModal(null)
        onNotify(res.message || 'Penugasan mengajar berhasil ditambahkan.')
        loadCourseAssignments()
      } else {
        setModalError(res.message || 'Gagal menambahkan penugasan.')
      }
    } else {
      const res = await assignmentService.updateCourseAssignment(modal.item.id, {
        weekly_hours: Number(formWeeklyHours),
        role: formRole,
        status: formStatus,
        notes: formNotes,
      })

      setModalSubmitting(false)
      if (res.success) {
        setModal(null)
        onNotify(res.message || 'Penugasan mengajar berhasil diperbarui.')
        loadCourseAssignments()
      } else {
        setModalError(res.message || 'Gagal memperbarui penugasan.')
      }
    }
  }

  // Delete Assignment
  const handleDeleteAssignment = async (item) => {
    const tch = item.teacher?.name || 'Guru'
    const sbj = item.subject?.name || 'Mapel'
    const cls = item.school_class?.name || 'Kelas'
    if (!window.confirm(`Hapus penugasan ${tch} untuk mapel ${sbj} di ${cls}?`)) {
      return
    }
    const res = await assignmentService.deleteCourseAssignment(item.id)
    if (res.success) {
      onNotify(res.message || 'Penugasan mengajar berhasil dihapus.')
      loadCourseAssignments()
    } else {
      alert(res.message || 'Gagal menghapus penugasan.')
    }
  }

  const summary = [
    { title: 'Total Penugasan', value: stats?.total_assignments ?? assignments.length, caption: 'Penugasan aktif', icon: 'clipboard', tone: 'green' },
    { title: 'Guru Ditugaskan', value: stats?.assigned_teachers ?? new Set(assignments.map((a) => a.teacher_id)).size, caption: 'Guru pengampu', icon: 'users', tone: 'blue' },
    { title: 'Mata Pelajaran', value: stats?.assigned_subjects ?? new Set(assignments.map((a) => a.subject_id)).size, caption: 'Mapel terampu', icon: 'book', tone: 'orange' },
    { title: 'Total Jam / Minggu', value: `${stats?.total_weekly_hours ?? 0} JP`, caption: 'Beban mengajar', icon: 'academic', tone: 'purple' },
  ]

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const pagination = {
    currentPage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage: (val) => { setRowsPerPage(val); setCurrentPage(1) },
  }

  return (
    <>
      <AcademicSummary items={summary} />
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid five-fields">
            <AcademicField
              disabled={loadingRefs}
              label="Tahun Ajaran"
              onChange={(e) => { setSelectedYearId(e.target.value); setCurrentPage(1) }}
              options={years.map((y) => ({ value: String(y.id), label: `${y.name} (${y.status})` }))}
              value={selectedYearId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Semester"
              onChange={(e) => { setSelectedSemesterId(e.target.value); setCurrentPage(1) }}
              options={availableSemesters.map((s) => ({ value: String(s.id), label: `${s.name} (${s.status})` }))}
              value={selectedSemesterId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Kelas"
              onChange={(e) => { setSelectedClassId(e.target.value); setCurrentPage(1) }}
              options={[{ value: 'Semua Kelas', label: 'Semua Kelas' }, ...availableClasses.map((c) => ({ value: String(c.id), label: c.name }))]}
              value={selectedClassId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Mata Pelajaran"
              onChange={(e) => { setSelectedSubjectId(e.target.value); setCurrentPage(1) }}
              options={[{ value: 'Semua Mata Pelajaran', label: 'Semua Mata Pelajaran' }, ...subjects.map((sb) => ({ value: String(sb.id), label: `${sb.code} - ${sb.name}` }))]}
              value={selectedSubjectId}
            />
            <AcademicField
              disabled={loadingRefs}
              label="Guru"
              onChange={(e) => { setSelectedTeacherId(e.target.value); setCurrentPage(1) }}
              options={[{ value: 'Semua Guru', label: 'Semua Guru' }, ...teachers.map((tc) => ({ value: String(tc.id), label: tc.name }))]}
              value={selectedTeacherId}
            />
          </div>
          <AcademicSearch
            ariaLabel="Cari guru atau mata pelajaran"
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Cari guru / mata pelajaran..."
            value={searchQuery}
          />
        </div>

        <div className="academic-actions">
          <div>
            <h3>Daftar Penugasan Guru</h3>
            <p>Penugasan guru mengajar per rombel, mata pelajaran, dan semester</p>
          </div>
          <Button className="academic-button primary" onClick={() => openModal('add')} type="button">
            <Icon name="plus" /> Tambah Penugasan
          </Button>
        </div>

        <div className="academic-table-scroll">
          <table className="academic-table academic-assignment-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Guru</th>
                <th>Mata Pelajaran</th>
                <th>Kelas</th>
                <th>Jam/Minggu</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingAssignments ? (
                <tr>
                  <td className="academic-empty-row" colSpan="8">
                    <span>Memuat penugasan mengajar...</span>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td className="academic-empty-row" colSpan="8">
                    <Icon name="search" />
                    <strong>Penugasan tidak ditemukan</strong>
                    <span>Belum ada data penugasan mengajar sesuai filter yang dipilih.</span>
                  </td>
                </tr>
              ) : assignments.map((item, index) => {
                const tch = item.teacher || {}
                const sbj = item.subject || {}
                const cls = item.school_class || {}
                return (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="academic-name-cell">
                      <strong>{tch.name}</strong>
                      <small style={{ display: 'block', color: '#64748b' }}>{tch.nip || '-'}</small>
                    </td>
                    <td>
                      <strong>{sbj.name}</strong>
                      <small style={{ display: 'block', color: '#64748b' }}>{sbj.code}</small>
                    </td>
                    <td>{cls.name}</td>
                    <td>
                      <span className="academic-hours">{item.weekly_hours} JP</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: item.role === 'Utama' ? '#eff6ff' : '#f8fafc',
                        color: item.role === 'Utama' ? '#1d4ed8' : '#475569',
                      }}>
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <span className={`academic-status ${toStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="academic-row-actions">
                        <button
                          aria-label={`Edit penugasan ${tch.name}`}
                          onClick={() => openModal('edit', item)}
                          title="Edit Penugasan"
                          type="button"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          aria-label={`Hapus penugasan ${tch.name}`}
                          onClick={() => handleDeleteAssignment(item)}
                          title="Hapus Penugasan"
                          type="button"
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationFooter itemLabel="penugasan" pagination={pagination} totalItems={totalItems} />
      </section>

      {/* MODAL TAMBAH / EDIT PENUGASAN MENGAJAR */}
      {modal && (
        <AcademicModal
          description="Aturan bisnis: Satu rombel/mapel/semester hanya memiliki 1 guru dengan peran 'Utama'."
          onClose={() => setModal(null)}
          title={`${modal.type === 'edit' ? 'Edit' : 'Tambah'} Penugasan Guru`}
        >
          <form className="academic-entity-form" onSubmit={handleModalSubmit}>
            <div className="academic-form-grid">
              <label>
                <span>Guru Pengampu<b>*</b></span>
                <select
                  disabled={modal.type === 'edit'}
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} {t.nip ? `(${t.nip})` : ''}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mata Pelajaran<b>*</b></span>
                <select
                  disabled={modal.type === 'edit'}
                  required
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                >
                  <option value="">-- Pilih Mapel --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Rombongan Belajar<b>*</b></span>
                <select
                  disabled={modal.type === 'edit'}
                  required
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Jumlah Jam / Minggu (JP)<b>*</b></span>
                <input
                  min={1}
                  required
                  type="number"
                  value={formWeeklyHours}
                  onChange={(e) => setFormWeeklyHours(e.target.value)}
                />
              </label>
              <label>
                <span>Peran Guru<b>*</b></span>
                <select
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="Utama">Utama</option>
                  <option value="Pendamping">Pendamping</option>
                  <option value="Pengganti">Pengganti</option>
                </select>
              </label>
              {modal.type === 'edit' ? (
                <label>
                  <span>Status Penugasan<b>*</b></span>
                  <select
                    required
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </label>
              ) : (
                <label>
                  <span>Catatan</span>
                  <input
                    placeholder="Catatan tambahan..."
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </label>
              )}
            </div>
            {modalError && (
              <div className="academic-conflict-alert" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                <Icon name="info" />
                <span>{modalError}</span>
              </div>
            )}
            <footer>
              <Button className="academic-button secondary" onClick={() => setModal(null)} type="button">
                Batal
              </Button>
              <Button className="academic-button primary" disabled={modalSubmitting} type="submit">
                <Icon name="save" /> {modalSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}
              </Button>
            </footer>
          </form>
        </AcademicModal>
      )}
    </>
  )
}

// =============================================================================
// 4. ACADEMIC ROOM ALLOCATION VIEW (Pembagian Ruangan - Preserved Mock/Local State)
// =============================================================================
export function AcademicRoomAllocationView({ onNotify }) {
  const [allocations, setAllocations] = useState(() => roomAssignments.map((item) => ({ ...item })))
  const [filters, setFilters] = useState({ day: 'Semua Hari', className: 'Semua Kelas', room: 'Semua Ruangan', status: 'Semua Status' })
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [conflict, setConflict] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const dayOptions = academicOptions.days.filter((day) => day !== 'Semua Hari')

  function getNextId(items) {
    return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1
  }

  const filteredAllocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return allocations.filter((item) => (filters.day === 'Semua Hari' || item.day === filters.day)
      && (filters.className === 'Semua Kelas' || item.className === filters.className)
      && (filters.room === 'Semua Ruangan' || item.room === filters.room)
      && (filters.status === 'Semua Status' || item.status === filters.status)
      && (!query || [item.subject, item.teacher, item.className, item.room].some((value) => String(value ?? '').toLowerCase().includes(query))))
  }, [allocations, filters, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredAllocations.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const pageItems = filteredAllocations.slice(startIndex, startIndex + rowsPerPage)

  const pagination = {
    currentPage: safePage,
    rowsPerPage,
    totalPages,
    setCurrentPage,
    setRowsPerPage: (value) => { setRowsPerPage(value); setCurrentPage(1) },
  }

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  const saveAllocation = (formData) => {
    const source = modal?.item
    const existing = formData.status !== 'Tidak Aktif'
      ? allocations.find((item) => item.id !== source?.id
        && item.status !== 'Tidak Aktif'
        && item.day === formData.day
        && item.time === formData.time
        && item.room === formData.room)
      : null
    if (existing) {
      setConflict(`${formData.room} sudah digunakan oleh ${existing.className} untuk ${existing.subject} pada waktu yang sama.`)
      return
    }
    const next = { ...(source ?? {}), ...formData, id: source?.id ?? getNextId(allocations), status: formData.status || 'Aktif', conflict: false }
    setAllocations((current) => source ? current.map((item) => item.id === source.id ? next : item) : [next, ...current])
    setModal(null)
    setConflict('')
    setCurrentPage(1)
    onNotify(`Pembagian ${next.room} untuk ${next.className} berhasil disimpan.`)
  }

  const openModal = (type, item) => { setConflict(''); setModal({ type, item }) }
  const detectedConflicts = allocations.filter((item) => item.conflict).length

  return (
    <>
      {detectedConflicts > 0 && (
        <div className="academic-page-alert">
          <Icon name="info" />
          <div>
            <strong>{detectedConflicts} bentrok ruangan terdeteksi</strong>
            <span>Periksa alokasi ruangan pada hari dan jam yang sama.</span>
          </div>
        </div>
      )}
      <section className="academic-workspace">
        <div className="academic-toolbar">
          <div className="academic-filter-grid four-fields">
            <AcademicField label="Hari" onChange={(event) => updateFilter('day', event.target.value)} options={['Semua Hari', ...dayOptions]} value={filters.day} />
            <AcademicField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={['Semua Kelas', ...academicOptions.classes]} value={filters.className} />
            <AcademicField label="Ruangan" onChange={(event) => updateFilter('room', event.target.value)} options={['Semua Ruangan', ...academicOptions.rooms]} value={filters.room} />
            <AcademicField label="Status" onChange={(event) => updateFilter('status', event.target.value)} options={['Semua Status', ...academicOptions.statuses]} value={filters.status} />
          </div>
          <AcademicSearch ariaLabel="Cari alokasi ruangan" onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1) }} placeholder="Cari kelas / mapel / ruangan..." value={searchQuery} />
        </div>
        <div className="academic-actions">
          <div>
            <h3>Pembagian Ruangan</h3>
            <p>Atur pemakaian ruang untuk jadwal pembelajaran</p>
          </div>
          <Button className="academic-button primary" onClick={() => openModal('add')} type="button">
            <Icon name="plus" /> Tambah Alokasi
          </Button>
        </div>
        <div className="academic-table-scroll">
          <table className="academic-table academic-room-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Hari</th>
                <th>Jam</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Ruangan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="academic-empty-row" colSpan="8">
                    <Icon name="search" />
                    <strong>Alokasi tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : pageItems.map((item, index) => {
                const hasConflict = Boolean(item.conflict)
                return (
                  <tr className={hasConflict ? 'has-conflict' : ''} key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>{item.day}</td>
                    <td>{item.time}</td>
                    <td className="academic-name-cell">{item.className}</td>
                    <td>{item.subject}</td>
                    <td><span className="academic-room-badge">{item.room}</span></td>
                    <td><span className={`academic-status ${hasConflict ? 'conflict' : toStatusClass(item.status)}`}>{hasConflict ? 'Bentrok Ruangan' : item.status}</span></td>
                    <td>
                      <div className="academic-row-actions">
                        <button aria-label={`Edit alokasi ${item.className}`} onClick={() => openModal('edit', item)} type="button">
                          <Icon name="edit" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationFooter itemLabel="alokasi" pagination={pagination} totalItems={filteredAllocations.length} />
      </section>

      {modal && (
        <AcademicModal
          description="Sistem akan memeriksa bentrok ruangan pada local state."
          onClose={() => { setModal(null); setConflict('') }}
          title={`${modal.type === 'edit' ? 'Edit' : 'Tambah'} Pembagian Ruangan`}
        >
          <form
            className="academic-entity-form"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              saveAllocation({
                day: fd.get('day'),
                time: fd.get('time'),
                className: fd.get('className'),
                subject: fd.get('subject'),
                room: fd.get('room'),
                status: fd.get('status'),
              })
            }}
          >
            <div className="academic-form-grid">
              <label>
                <span>Hari<b>*</b></span>
                <select defaultValue={modal.item?.day || dayOptions[0]} name="day" required>
                  {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>
                <span>Jam<b>*</b></span>
                <select defaultValue={modal.item?.time || academicOptions.timeSlots[0]} name="time" required>
                  {academicOptions.timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span>Kelas<b>*</b></span>
                <select defaultValue={modal.item?.className || academicOptions.classes[0]} name="className" required>
                  {academicOptions.classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span>Mata Pelajaran<b>*</b></span>
                <select defaultValue={modal.item?.subject || academicOptions.subjects[0]} name="subject" required>
                  {academicOptions.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                <span>Ruangan<b>*</b></span>
                <select defaultValue={modal.item?.room || academicOptions.rooms[0]} name="room" required>
                  {academicOptions.rooms.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label>
                <span>Status<b>*</b></span>
                <select defaultValue={modal.item?.status || 'Aktif'} name="status" required>
                  {academicOptions.statuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
            </div>
            {conflict && (
              <div className="academic-conflict-alert">
                <Icon name="info" />
                <span><strong>Bentrok Ruangan: </strong>{conflict}</span>
              </div>
            )}
            <footer>
              <Button className="academic-button secondary" onClick={() => { setModal(null); setConflict('') }} type="button">
                Batal
              </Button>
              <Button className="academic-button primary" type="submit">
                <Icon name="save" /> Simpan Alokasi
              </Button>
            </footer>
          </form>
        </AcademicModal>
      )}
    </>
  )
}
