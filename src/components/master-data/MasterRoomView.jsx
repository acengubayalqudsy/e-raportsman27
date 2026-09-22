import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import roomService from '../../services/roomService.js'
import { MasterDeleteModal, MasterDetailModal } from './MasterModals.jsx'
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
              <div className="master-form-error-alert" role="alert">
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
            <Button className="master-button secondary" disabled={isSubmitting} onClick={onClose} type="button">
              Batal
            </Button>
            <Button className="master-button primary" disabled={isSubmitting} type="submit">
              <Icon name="save" />
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui Ruangan' : 'Simpan Ruangan'}
            </Button>
          </footer>
        </form>
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

  const handleDelete = async (roomOrId) => {
    const id = roomOrId?.id ?? roomOrId
    try {
      const res = await roomService.deleteRoom(id)
      if (res.success) {
        onNotify?.(res.message || 'Ruangan berhasil dihapus.')
        setActiveModal(null)
        setSelectedRoom(null)
        setRefreshTrigger((prev) => prev + 1)
        return { success: true }
      }
      return res
    } catch {
      return { success: false, error: 'Terjadi kendala jaringan saat menghapus data ruangan.' }
    }
  }

  const summaryCards = useMemo(() => {
    const total = stats?.total_rooms ?? meta.total ?? 0
    const kelas = stats?.class_rooms ?? stats?.type_counts?.Kelas ?? 0
    const lab = stats?.lab_rooms ?? stats?.type_counts?.Laboratorium ?? 0
    const totalCap = stats?.total_capacity ?? 0

    return [
      {
        id: 'total-rooms',
        title: 'Total Ruangan',
        value: total.toLocaleString('id-ID'),
        caption: `${kelas} Ruang Kelas`,
        icon: 'building',
        tone: 'blue',
        positive: true,
        captionIcon: 'arrowUp',
        sparkline: summarySparklines[0],
      },
      {
        id: 'class-rooms',
        title: 'Ruang Kelas',
        value: kelas.toLocaleString('id-ID'),
        caption: `${total ? Math.round((kelas / total) * 100) : 0}% dari total`,
        icon: 'academic',
        tone: 'green',
        positive: true,
        captionIcon: 'arrowUp',
        sparkline: summarySparklines[1],
      },
      {
        id: 'lab-rooms',
        title: 'Laboratorium',
        value: lab.toLocaleString('id-ID'),
        caption: 'Praktik & Komputer',
        icon: 'screen',
        tone: 'purple',
        positive: true,
        captionIcon: 'arrowUp',
        sparkline: summarySparklines[2],
      },
      {
        id: 'total-capacity',
        title: 'Total Kapasitas',
        value: totalCap.toLocaleString('id-ID'),
        caption: 'Kapasitas Siswa',
        icon: 'users',
        tone: 'orange',
        positive: true,
        captionIcon: 'arrowUp',
        sparkline: summarySparklines[3],
      },
    ]
  }, [stats, meta.total])

  return (
    <div className="master-room-view">
      <MasterSummary items={summaryCards} />

      <section className="master-data-workspace" aria-label="Daftar Ruangan">
        <div className="master-data-toolbar">
          <div className="master-filter-grid master-reference-filters" style={{ gridTemplateColumns: 'repeat(2, minmax(130px, 1fr))' }}>
            <label className="master-field">
              <span>Jenis Ruangan</span>
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

            <label className="master-field">
              <span>Status</span>
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

          <label className="master-search">
            <SearchInput
              aria-label="Cari kode atau nama ruangan"
              placeholder="Cari kode atau nama ruangan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="master-data-actions">
          <div className="master-table-heading" style={{ borderTop: 'none', minHeight: 'auto' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              Daftar Ruangan {meta.total ? `(${meta.total} Total)` : ''}
            </h3>
          </div>

          <div>
            <Button
              className="master-button secondary"
              onClick={() => {
                setRefreshTrigger((prev) => prev + 1)
                onNotify?.('Data ruangan diperbarui.')
              }}
              type="button"
            >
              <Icon name="refresh" /> Segarkan
            </Button>
            <Button
              className="master-button primary"
              onClick={() => {
                setSelectedRoom(null)
                setActiveModal('add')
              }}
              type="button"
            >
              <Icon name="plus" /> Tambah Ruangan
            </Button>
          </div>
        </div>

        <div className="master-table-scroll">
          <table className="master-reference-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode</th>
                <th>Nama Ruangan</th>
                <th>Tipe</th>
                <th>Kapasitas</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
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
                    <Icon name="search" />
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
                        <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
                          {room.code}
                        </code>
                      </td>
                      <td className="master-name-cell">
                        <strong>{room.name}</strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          background: isClass ? '#e0f2fe' : isLab ? '#fef3c7' : '#f1f5f9',
                          color: isClass ? '#0369a1' : isLab ? '#b45309' : '#475569',
                        }}>
                          {room.room_type}
                        </span>
                      </td>
                      <td>
                        <strong>{room.capacity}</strong> <small style={{ color: '#64748b', fontSize: '8px' }}>Siswa</small>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontSize: '9px' }}>
                          {room.building ? room.building : '-'}
                          {room.floor ? ` (${room.floor})` : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`master-data-status ${room.status?.toLowerCase() === 'aktif' ? 'aktif' : 'tidak-aktif'}`}>
                          {room.status}
                        </span>
                      </td>
                      <td>
                        <div className="master-row-actions">
                          <button
                            aria-label={`Detail ${room.name}`}
                            title="Detail"
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setActiveModal('detail')
                            }}
                          >
                            <Icon name="eye" />
                          </button>
                          <button
                            aria-label={`Edit ${room.name}`}
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
                            className="delete"
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
          onClose={() => {
            setActiveModal(null)
            setSelectedRoom(null)
          }}
          onSave={handleCreate}
        />
      )}

      {activeModal === 'edit' && selectedRoom && (
        <RoomModal
          initialData={selectedRoom}
          onClose={() => {
            setActiveModal(null)
            setSelectedRoom(null)
          }}
          onSave={handleUpdate}
        />
      )}

      {activeModal === 'detail' && selectedRoom && (
        <MasterDetailModal
          entityLabel="Ruangan"
          name={selectedRoom.name}
          onClose={() => {
            setActiveModal(null)
            setSelectedRoom(null)
          }}
          onEdit={() => {
            setActiveModal('edit')
          }}
          sections={[
            {
              title: 'Identitas Ruangan',
              items: [
                { label: 'Kode Ruangan', value: selectedRoom.code },
                { label: 'Nama Ruangan', value: selectedRoom.name },
                { label: 'Tipe Ruangan', value: selectedRoom.room_type },
                { label: 'Status', value: selectedRoom.status || 'Aktif' },
              ],
            },
            {
              title: 'Lokasi & Fasilitas',
              items: [
                { label: 'Kapasitas', value: `${selectedRoom.capacity || 0} Siswa` },
                { label: 'Gedung', value: selectedRoom.building || '-' },
                { label: 'Lantai', value: selectedRoom.floor || '-' },
                { label: 'Keterangan', value: selectedRoom.notes || selectedRoom.description || '-' },
              ],
            },
          ]}
        />
      )}

      {activeModal === 'delete' && selectedRoom && (
        <MasterDeleteModal
          entityLabel="Ruangan"
          item={selectedRoom}
          onClose={() => {
            setActiveModal(null)
            setSelectedRoom(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export default MasterRoomView
