import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import roomService from '../../services/roomService.js'
import MasterPagination from './MasterPagination.jsx'
import MasterSummary from './MasterSummary.jsx'

const ROOM_TYPES = [
  'Semua',
  'Kelas',
  'Laboratorium',
  'Perpustakaan',
  'Aula',
  'Kantor',
  'Lainnya',
]

const ROOM_STATUSES = [
  'Semua',
  'Aktif',
  'Tidak Aktif',
]

const summarySparklines = [
  'M0 27 C7 23 11 14 17 18 C24 22 29 7 36 10 C43 13 47 5 52 8',
  'M0 28 C6 21 11 23 17 15 C23 8 29 17 36 11 C43 5 47 12 52 7',
  'M0 25 C7 27 10 13 18 14 C25 15 29 22 36 16 C43 10 47 17 52 12',
  'M0 27 C8 19 12 23 18 17 C25 10 31 20 38 12 C44 5 48 11 52 8',
]

function RoomModal({ initialData = null, onClose, onSave }) {
  const isEdit = Boolean(initialData?.id)
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    capacity: initialData?.capacity || 36,
    room_type: initialData?.room_type || 'Kelas',
    building: initialData?.building || '',
    floor: initialData?.floor || '',
    status: initialData?.status || 'Aktif',
    notes: initialData?.notes || initialData?.description || '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
    if (errorMessage) setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity) || 36,
        status: formData.status === 'Tidak Aktif' || formData.status === 'Nonaktif' ? 'Tidak Aktif' : 'Aktif',
        notes: formData.notes || '',
      }
      const res = await onSave(payload)
      if (res && !res.success) {
        setErrorMessage(res.error || 'Terjadi kesalahan saat menyimpan data.')
        if (res.errors) setFieldErrors(res.errors)
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat memproses.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="master-modal-backdrop" role="presentation">
      <section aria-modal="true" className="master-modal regular" role="dialog">
        <header>
          <div>
            <h3>{isEdit ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</h3>
            <p>{isEdit ? 'Perbarui informasi spesifikasi ruangan sekolah.' : 'Masukkan rincian ruangan pembelajaran atau fasilitas.'}</p>
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>

        <form className="master-entity-form" onSubmit={handleSubmit}>
          <div className="master-form-scroll">
            {errorMessage && (
              <div className="master-form-error-alert" role="alert" style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Icon name="info" />
                <span>{errorMessage}</span>
              </div>
            )}

            <fieldset>
              <legend>Identitas Ruangan</legend>
              <div className="master-form-grid">
                <label>
                  <span>Kode Ruangan <b>*</b></span>
                  <input
                    placeholder="Contoh: R-X-1 / LAB-KOMP"
                    required
                    style={fieldErrors.code ? { borderColor: '#ef4444' } : {}}
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                  />
                  {fieldErrors.code && <small style={{ color: '#ef4444' }}>{fieldErrors.code[0]}</small>}
                </label>

                <label>
                  <span>Nama Ruangan <b>*</b></span>
                  <input
                    placeholder="Contoh: Ruang Kelas X-1"
                    required
                    style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {fieldErrors.name && <small style={{ color: '#ef4444' }}>{fieldErrors.name[0]}</small>}
                </label>

                <label>
                  <span>Tipe Ruangan <b>*</b></span>
                  <select
                    required
                    value={formData.room_type}
                    onChange={(e) => handleChange('room_type', e.target.value)}
                  >
                    <option value="Kelas">Kelas</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Aula">Aula</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>

                <label>
                  <span>Kapasitas (Siswa) <b>*</b></span>
                  <input
                    min="0"
                    placeholder="36"
                    required
                    style={fieldErrors.capacity ? { borderColor: '#ef4444' } : {}}
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                  />
                  {fieldErrors.capacity && <small style={{ color: '#ef4444' }}>{fieldErrors.capacity[0]}</small>}
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Lokasi & Status</legend>
              <div className="master-form-grid">
                <label>
                  <span>Gedung</span>
                  <input
                    placeholder="Contoh: Gedung A / Gedung Utama"
                    type="text"
                    value={formData.building}
                    onChange={(e) => handleChange('building', e.target.value)}
                  />
                </label>

                <label>
                  <span>Lantai</span>
                  <input
                    placeholder="Contoh: Lantai 1 / Lantai 2"
                    type="text"
                    value={formData.floor}
                    onChange={(e) => handleChange('floor', e.target.value)}
                  />
                </label>

                <label>
                  <span>Status Ruangan <b>*</b></span>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </label>

                <label className="full-width">
                  <span>Keterangan Tambahan</span>
                  <textarea
                    placeholder="Fasilitas AC, Proyektor, whiteboard, dsb."
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          </div>

          <footer className="master-modal-footer">
            <Button className="secondary" disabled={isSubmitting} onClick={onClose} type="button">Batal</Button>
            <Button className="primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui Ruangan' : 'Simpan Ruangan'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RoomDetailModal({ onClose, room }) {
  if (!room) return null

  const details = [
    ['Kode Ruangan', room.code],
    ['Nama Ruangan', room.name],
    ['Tipe Ruangan', room.room_type],
    ['Kapasitas', `${room.capacity || 0} Siswa`],
    ['Gedung', room.building || '-'],
    ['Lantai', room.floor || '-'],
    ['Status', room.status || 'Aktif'],
    ['Keterangan', room.description || '-'],
  ]

  return (
    <div className="master-modal-backdrop" role="presentation">
      <section aria-modal="true" className="master-modal regular" role="dialog">
        <header>
          <div>
            <h3>Detail Ruangan: {room.name}</h3>
            <p>Informasi lengkap fasilitas ruangan sekolah.</p>
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>

        <div className="master-detail-content" style={{ padding: '20px' }}>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px', margin: 0 }}>
            {details.map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <dt style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{label}</dt>
                <dd style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer className="master-modal-footer">
          <Button className="primary" onClick={onClose} type="button">Tutup</Button>
        </footer>
      </section>
    </div>
  )
}

function RoomDeleteModal({ isDeleting, onClose, onConfirm, room }) {
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setError('')
    const res = await onConfirm(room.id)
    if (res && !res.success) {
      setError(res.error || 'Gagal menghapus ruangan.')
    }
  }

  return (
    <div className="master-modal-backdrop" role="presentation">
      <section aria-modal="true" className="master-modal compact" role="dialog">
        <header>
          <div>
            <h3>Hapus Ruangan</h3>
            <p>Konfirmasi penghapusan data master ruangan.</p>
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>

        <div style={{ padding: '20px', fontSize: '0.9rem', color: '#475569' }}>
          {error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', lineHeight: '1.4' }}>
              <strong>Gagal Menghapus:</strong> {error}
            </div>
          ) : (
            <p>
              Apakah Anda yakin ingin menghapus ruangan <strong>{room?.name} ({room?.code})</strong>?
              Tindakan ini tidak dapat dibatalkan jika ruangan masih digunakan.
            </p>
          )}
        </div>

        <footer className="master-modal-footer">
          <Button className="secondary" disabled={isDeleting} onClick={onClose} type="button">Batal</Button>
          {!error && (
            <Button className="danger" disabled={isDeleting} onClick={handleConfirm} type="button">
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Ruangan'}
            </Button>
          )}
        </footer>
      </section>
    </div>
  )
}

function MasterRoomView({ onNotify }) {
  const [rooms, setRooms] = useState([])
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('Semua')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // Modals state
  const [activeModal, setActiveModal] = useState(null) // 'add' | 'edit' | 'detail' | 'delete'
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 1. Fetch statistics
  useEffect(() => {
    let isMounted = true
    roomService
      .getStats()
      .then((res) => {
        if (!isMounted) return
        if (res.success) setStats(res.data)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // 2. Fetch paginated rooms
  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true)
      roomService
        .getRooms({
          page,
          per_page: perPage,
          search,
          room_type: roomTypeFilter,
          status: statusFilter,
        })
        .then((res) => {
          if (!isMounted) return
          if (res.success) {
            setRooms(res.data)
            setMeta(res.meta)
          } else {
            onNotify?.(`Gagal memuat ruangan: ${res.error}`)
          }
          setIsLoading(false)
        })
        .catch(() => {
          if (!isMounted) return
          onNotify?.('Terjadi kesalahan saat memuat data ruangan.')
          setIsLoading(false)
        })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [page, perPage, roomTypeFilter, statusFilter, search, refreshTrigger, onNotify])

  const handleCreate = async (payload) => {
    const res = await roomService.createRoom(payload)
    if (res.success) {
      onNotify?.(res.message || 'Ruangan berhasil ditambahkan.')
      setActiveModal(null)
      setRefreshTrigger((prev) => prev + 1)
      return { success: true }
    }
    return res
  }

  const handleUpdate = async (payload) => {
    if (!selectedRoom?.id) return
    const res = await roomService.updateRoom(selectedRoom.id, payload)
    if (res.success) {
      onNotify?.(res.message || 'Ruangan berhasil diperbarui.')
      setActiveModal(null)
      setRefreshTrigger((prev) => prev + 1)
      return { success: true }
    }
    return res
  }

  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      const res = await roomService.deleteRoom(id)
      if (res.success) {
        onNotify?.(res.message || 'Ruangan berhasil dihapus.')
        setActiveModal(null)
        setRefreshTrigger((prev) => prev + 1)
        return { success: true }
      }
      return res
    } finally {
      setIsDeleting(false)
    }
  }

  const summaryCards = useMemo(() => {
    const total = stats?.total_rooms ?? meta.total ?? 0
    const kelas = stats?.class_rooms ?? 0
    const lab = stats?.lab_rooms ?? 0
    const totalCap = stats?.total_capacity ?? 0

    return [
      {
        id: 'total-rooms',
        title: 'Total Ruangan',
        value: total.toLocaleString('id-ID'),
        change: `${kelas} Ruang Kelas`,
        trend: 'up',
        sparkline: summarySparklines[0],
      },
      {
        id: 'class-rooms',
        title: 'Ruang Kelas',
        value: kelas.toLocaleString('id-ID'),
        change: `${total ? Math.round((kelas / total) * 100) : 0}% dari total`,
        trend: 'up',
        sparkline: summarySparklines[1],
      },
      {
        id: 'lab-rooms',
        title: 'Laboratorium & Khusus',
        value: lab.toLocaleString('id-ID'),
        change: 'Ruang Praktik/Lab',
        trend: 'neutral',
        sparkline: summarySparklines[2],
      },
      {
        id: 'total-capacity',
        title: 'Total Kapasitas Siswa',
        value: totalCap.toLocaleString('id-ID'),
        change: 'Daya Tampung Keseluruhan',
        trend: 'up',
        sparkline: summarySparklines[3],
      },
    ]
  }, [stats, meta.total])

  return (
    <div className="master-room-view">
      <MasterSummary items={summaryCards} />

      <section className="master-panel" aria-label="Daftar Ruangan">
        <header className="master-panel-header">
          <div className="master-panel-title">
            <h3>Master Data Ruangan</h3>
            <p>Kelola ruang kelas, laboratorium, perpustakaan, dan fasilitas sekolah.</p>
          </div>

          <div className="master-panel-actions">
            <Button
              className="secondary"
              onClick={() => {
                setRefreshTrigger((prev) => prev + 1)
                onNotify?.('Data ruangan diperbarui.')
              }}
              type="button"
            >
              <Icon name="refresh" /> Segarkan
            </Button>
            <Button
              className="primary"
              onClick={() => {
                setSelectedRoom(null)
                setActiveModal('add')
              }}
              type="button"
            >
              <Icon name="plus" /> Tambah Ruangan
            </Button>
          </div>
        </header>

        <div className="master-filter-bar">
          <div className="master-search-wrap">
            <SearchInput
              aria-label="Cari kode atau nama ruangan"
              placeholder="Cari kode atau nama ruangan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="master-filter-group">
            <label className="master-filter-select">
              <span>Tipe:</span>
              <select
                value={roomTypeFilter}
                onChange={(e) => {
                  setRoomTypeFilter(e.target.value)
                  setPage(1)
                }}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="master-filter-select">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="master-table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode</th>
                <th>Nama Ruangan</th>
                <th>Tipe</th>
                <th>Kapasitas</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="master-empty-row" colSpan="8">
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#64748b' }}>Memuat data ruangan dari server...</p>
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan="8">
                    <Icon name="screen" />
                    <strong>Tidak ada data ruangan</strong>
                    <span>Coba ubah kata kunci pencarian atau filter tipe.</span>
                  </td>
                </tr>
              ) : (
                rooms.map((room, index) => {
                  const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1
                  const isClass = room.room_type === 'Kelas'
                  const isLab = room.room_type === 'Laboratorium'

                  return (
                    <tr key={room.id}>
                      <td>{rowNumber}</td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                          {room.code}
                        </code>
                      </td>
                      <td className="master-name-cell">
                        <strong>{room.name}</strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: isClass ? '#e0f2fe' : isLab ? '#fef3c7' : '#f1f5f9',
                          color: isClass ? '#0369a1' : isLab ? '#b45309' : '#475569',
                        }}>
                          {room.room_type}
                        </span>
                      </td>
                      <td>
                        <strong>{room.capacity}</strong> Siswa
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontSize: '0.875rem' }}>
                          {room.building ? room.building : '-'}
                          {room.floor ? ` (${room.floor})` : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`master-status ${room.status?.toLowerCase() === 'aktif' ? 'active' : 'inactive'}`}>
                          {room.status}
                        </span>
                      </td>
                      <td>
                        <div className="master-row-actions" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            aria-label={`Detail ${room.name}`}
                            className="master-action-btn view"
                            title="Detail"
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setActiveModal('detail')
                            }}
                          >
                            <Icon name="screen" />
                          </button>
                          <button
                            aria-label={`Edit ${room.name}`}
                            className="master-action-btn edit"
                            title="Edit"
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setActiveModal('edit')
                            }}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            aria-label={`Hapus ${room.name}`}
                            className="master-action-btn delete"
                            title="Hapus"
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setActiveModal('delete')
                            }}
                          >
                            <Icon name="trash" />
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

        {meta.total > 0 && (
          <MasterPagination
            currentPage={meta.current_page}
            itemLabel="ruangan"
            rowsPerPage={meta.per_page}
            totalItems={meta.total}
            totalPages={meta.last_page}
            onPageChange={(newPage) => setPage(newPage)}
            onRowsPerPageChange={(newPerPage) => {
              setPerPage(newPerPage)
              setPage(1)
            }}
          />
        )}
      </section>

      {activeModal === 'add' && (
        <RoomModal
          onClose={() => setActiveModal(null)}
          onSave={handleCreate}
        />
      )}

      {activeModal === 'edit' && (
        <RoomModal
          initialData={selectedRoom}
          onClose={() => setActiveModal(null)}
          onSave={handleUpdate}
        />
      )}

      {activeModal === 'detail' && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'delete' && (
        <RoomDeleteModal
          isDeleting={isDeleting}
          room={selectedRoom}
          onClose={() => setActiveModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export default MasterRoomView
