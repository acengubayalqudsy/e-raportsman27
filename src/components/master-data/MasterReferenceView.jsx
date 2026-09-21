import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { masterDatasets, masterSchemas, masterOptions } from '../../data/masterData.js'
import { MasterDeleteModal, MasterDetailModal, MasterEntityModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import academicService from '../../services/academicService.js'

const referenceKeys = [
  'kelas',
  'ruangan',
  'mata-pelajaran',
  'tahun-ajaran',
  'semester',
  'agama',
  'ekstrakurikuler',
  'pengguna-role',
]

const emptyRecords = []

const referenceConfig = {
  kelas: { filterKey: 'grade', filterLabel: 'Tingkat', allLabel: 'Semua Tingkat' },
  ruangan: { filterKey: 'type', filterLabel: 'Jenis Ruangan', allLabel: 'Semua Jenis' },
  'mata-pelajaran': { filterKey: 'group', filterLabel: 'Kelompok', allLabel: 'Semua Kelompok' },
  'tahun-ajaran': { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canActivate: true },
  semester: { filterKey: 'academicYear', filterLabel: 'Tahun Ajaran', allLabel: 'Semua Tahun', canActivate: true },
  agama: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status' },
  ekstrakurikuler: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status' },
  'pengguna-role': { filterKey: 'role', filterLabel: 'Role', allLabel: 'Semua Role', canToggleStatus: true },
}

function cloneReferenceDatasets() {
  return Object.fromEntries(
    referenceKeys.map((key) => [key, (masterDatasets[key] ?? []).map((item) => ({ ...item }))]),
  )
}

function getRecordName(record, schema) {
  if (!record) return schema.singular
  return record.name || record.code || schema.singular
}

function formatDateLabel(value) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replaceAll('.', '')
}

function toClassName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getDefaultRecord(activeKey) {
  const defaults = {
    kelas: { capacity: 36, status: 'Aktif' },
    ruangan: { capacity: 36, status: 'Aktif' },
    'mata-pelajaran': { weeklyHours: 2, grades: 'X, XI, XII', status: 'Aktif' },
    'tahun-ajaran': { status: 'Tidak Aktif' },
    semester: { status: 'Tidak Aktif' },
    agama: { status: 'Aktif' },
    ekstrakurikuler: { members: 0, status: 'Aktif' },
    'pengguna-role': { status: 'Aktif' },
  }

  return defaults[activeKey] ?? {}
}

function normalizeRecord(activeKey, formData, source, records) {
  const next = {
    ...(source ?? {}),
    ...formData,
    id: source?.id ?? Math.max(0, ...records.map((record) => Number(record.id) || 0)) + 1,
  }

  if ('capacity' in next) {
    next.capacity = Number(next.capacity) || 0
  }

  if (activeKey === 'kelas') {
    next.capacityLabel = `${next.capacity} siswa`
  }

  if (activeKey === 'mata-pelajaran') {
    next.weeklyHours = Number(next.weeklyHours) || 0
    next.hoursLabel = `${next.weeklyHours} JP`
  }

  if (activeKey === 'ekstrakurikuler') {
    next.members = Number(next.members) || 0
  }

  if (activeKey === 'tahun-ajaran' || activeKey === 'semester') {
    next.startLabel = formatDateLabel(next.startDate)
    next.endLabel = formatDateLabel(next.endDate)
  }

  if (activeKey === 'pengguna-role') {
    next.email = next.username
    next.lastLogin ??= 'Belum pernah'
  }

  next.status ||= 'Aktif'
  return next
}

function createDetailSections(record, schema) {
  const fields = [...schema.columns, ...schema.formFields].filter(
    (field, index, allFields) => allFields.findIndex((candidate) => candidate.key === field.key) === index,
  )

  return [
    {
      title: 'Informasi Utama',
      items: fields.map((field) => ({
        label: field.label,
        value: record[field.key] ?? '-',
      })),
    },
  ]
}

function ActivationConfirmation({ entityLabel, isActivating, item, onClose, onConfirm }) {
  return (
    <div className="master-modal-backdrop" role="presentation">
      <section
        aria-labelledby="master-activation-title"
        aria-modal="true"
        className="master-modal master-confirmation"
        role="dialog"
      >
        <header>
          <div>
            <h3 id="master-activation-title">Jadikan {entityLabel} Aktif?</h3>
            <p>Periode ini akan diaktifkan secara resmi di database.</p>
          </div>
          <button aria-label="Tutup konfirmasi" disabled={isActivating} onClick={onClose} type="button">&times;</button>
        </header>

        <div className="master-confirm-body">
          <span><Icon name="checkCircle" /></span>
          <div>
            <strong>{item.name}</strong>
            <p>Periode aktif sebelumnya akan dinonaktifkan untuk menjaga konsistensi data referensi akademik.</p>
          </div>
        </div>

        <footer className="master-modal-footer">
          <Button className="master-button secondary" disabled={isActivating} onClick={onClose}>Batal</Button>
          <Button className="master-button primary" disabled={isActivating} onClick={onConfirm}>
            {isActivating ? <span className="master-spinner" /> : <Icon name="check" />}
            {isActivating ? 'Mengaktifkan...' : 'Jadikan Aktif'}
          </Button>
        </footer>
      </section>
    </div>
  )
}

function MasterReferenceView({ activeKey, onNotify }) {
  // Non-academic mock state
  const [datasets, setDatasets] = useState(cloneReferenceDatasets)

  // Academic server state (Fase 5A)
  const [serverRecords, setServerRecords] = useState([])
  const [serverMeta, setServerMeta] = useState({ current_page: 1, last_page: 1, per_page: 8, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [availableYears, setAvailableYears] = useState([])
  const [isActivating, setIsActivating] = useState(false)

  // Common UI state
  const [searchQueries, setSearchQueries] = useState({})
  const [filterValues, setFilterValues] = useState({})
  const [currentPages, setCurrentPages] = useState({})
  const [rowsPerPages, setRowsPerPages] = useState({})
  const [openMenu, setOpenMenu] = useState(null)
  const [modal, setModal] = useState(null)
  const [activationItem, setActivationItem] = useState(null)

  const isAcademic = academicService.isAcademicKey(activeKey)
  const schema = masterSchemas[activeKey]
  const config = referenceConfig[activeKey]

  const searchQuery = searchQueries[activeKey] ?? ''
  const filterValue = filterValues[activeKey] ?? config?.allLabel ?? ''
  const currentPage = currentPages[activeKey] ?? 1
  const rowsPerPage = rowsPerPages[activeKey] ?? 8

  // Load available academic years for dropdowns when in academic mode
  useEffect(() => {
    if (isAcademic && ['semester', 'kelas'].includes(activeKey)) {
      let isMounted = true
      academicService
        .getAcademicYears({ per_page: 100 })
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            const names = res.data.map((y) => y.name)
            setAvailableYears(names)
          }
        })
        .catch(() => {})

      return () => {
        isMounted = false
      }
    }
  }, [isAcademic, activeKey, refreshTrigger])

  // Fetch academic data from MariaDB via REST API
  useEffect(() => {
    if (!isAcademic) return

    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true)
      setFetchError(null)

      const params = {
      page: currentPage,
      per_page: rowsPerPage,
      search: searchQuery,
    }

      if (config && filterValue !== config.allLabel) {
        params[config.filterKey] = filterValue
      }

      academicService
      .getItems(activeKey, params)
      .then((res) => {
        if (!isMounted) return
        if (res.success) {
          setServerRecords(res.data)
          setServerMeta(res.meta || { current_page: 1, last_page: 1, per_page: rowsPerPage, total: res.data.length })
          setFetchError(null)
        } else {
          setFetchError(res.error || 'Gagal memuat data dari MariaDB.')
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setFetchError('Terjadi kegagalan jaringan saat menghubungi server backend.')
        setIsLoading(false)
      })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [activeKey, isAcademic, currentPage, rowsPerPage, searchQuery, filterValue, refreshTrigger, config])

  // Computed filter options
  const filterOptions = useMemo(() => {
    if (!config) return []
    if (isAcademic) {
      if (activeKey === 'kelas') return ['X', 'XI', 'XII']
      if (activeKey === 'mata-pelajaran') return ['Umum', 'IPA', 'IPS', 'Muatan Lokal', 'Layanan']
      if (activeKey === 'tahun-ajaran') return ['Aktif', 'Tidak Aktif', 'Selesai', 'Akan Datang']
      if (activeKey === 'semester') {
        if (availableYears.length > 0) return availableYears
        return masterOptions.academicYears || []
      }
    }
    const mockRecs = datasets[activeKey] ?? emptyRecords
    return [...new Set(mockRecs.map((record) => record[config.filterKey]).filter(Boolean))]
  }, [config, isAcademic, activeKey, availableYears, datasets])

  // Local filtered records for non-academic datasets
  const mockFilteredRecords = useMemo(() => {
    if (isAcademic || !config) return []
    const mockRecs = datasets[activeKey] ?? emptyRecords
    const query = searchQuery.trim().toLowerCase()

    return mockRecs.filter((record) => {
      const matchesSearch =
        !query ||
        Object.values(record).some((value) =>
          ['string', 'number'].includes(typeof value) && String(value).toLowerCase().includes(query),
        )
      const matchesFilter =
        filterValue === config.allLabel || record[config.filterKey] === filterValue

      return matchesSearch && matchesFilter
    })
  }, [isAcademic, config, datasets, activeKey, searchQuery, filterValue])

  // Dynamic form fields for modals (inject real academic years into semester modal)
  const activeFormFields = useMemo(() => {
    if (!schema) return []
    if (activeKey === 'semester' && availableYears.length > 0) {
      return schema.formFields.map((f) => (f.key === 'academicYear' ? { ...f, options: availableYears } : f))
    }
    return schema.formFields
  }, [schema, activeKey, availableYears])

  if (!schema || !config) return null

  // Pagination calculation
  const totalItems = isAcademic ? serverMeta.total : mockFilteredRecords.length
  const totalPages = isAcademic
    ? Math.max(1, serverMeta.last_page)
    : Math.max(1, Math.ceil(mockFilteredRecords.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleRecords = isAcademic
    ? serverRecords
    : mockFilteredRecords.slice(startIndex, startIndex + rowsPerPage)

  const currentModal = modal?.key === activeKey ? modal : null
  const currentActivationItem = activationItem?.key === activeKey ? activationItem.item : null

  const setPage = (page) => {
    setCurrentPages((current) => ({ ...current, [activeKey]: page }))
  }

  // Save record (Create or Update)
  const saveRecord = async (formData) => {
    const source = currentModal?.item

    if (isAcademic) {
      if (source) {
        const res = await academicService.updateItem(activeKey, source.id, formData)
        if (!res.success) {
          return res
        }
        setModal(null)
        onNotify(`${schema.singular} ${formData.name || formData.code || ''} berhasil diperbarui di database.`)
        setRefreshTrigger((k) => k + 1)
        return res
      }

      const res = await academicService.createItem(activeKey, formData)
      if (!res.success) {
        return res
      }
      setModal(null)
      onNotify(`${schema.singular} ${formData.name || formData.code || ''} berhasil ditambahkan ke database.`)
      setPage(1)
      setRefreshTrigger((k) => k + 1)
      return res
    }

    // Non-academic: mock local storage
    const nextRecord = normalizeRecord(activeKey, formData, source, datasets[activeKey] ?? emptyRecords)
    setDatasets((current) => {
      const currentRecords = current[activeKey] ?? []
      let nextRecords = source
        ? currentRecords.map((record) => (record.id === source.id ? nextRecord : record))
        : [nextRecord, ...currentRecords]

      if (config.canActivate && nextRecord.status === 'Aktif') {
        nextRecords = nextRecords.map((record) =>
          record.id !== nextRecord.id && record.status === 'Aktif'
            ? { ...record, status: 'Selesai' }
            : record,
        )
      }

      return { ...current, [activeKey]: nextRecords }
    })

    setModal(null)
    setPage(1)
    onNotify(
      `${schema.singular} ${getRecordName(nextRecord, schema)} berhasil ${source ? 'diperbarui' : 'ditambahkan'}.`,
    )
    return { success: true }
  }

  // Delete confirmation
  const confirmDelete = async (item) => {
    if (isAcademic) {
      const res = await academicService.deleteItem(activeKey, item.id)
      if (res.success) {
        setModal(null)
        onNotify(`Data ${schema.singular} ${item.name || item.code} berhasil dihapus dari sistem.`)
        setRefreshTrigger((k) => k + 1)
      } else {
        onNotify(`Gagal menghapus ${schema.singular.toLowerCase()}: ${res.error}`)
      }
      return
    }

    // Non-academic
    setDatasets((current) => ({
      ...current,
      [activeKey]: (current[activeKey] ?? []).filter((r) => r.id !== item.id),
    }))
    setModal(null)
    onNotify(`Data ${schema.singular} ${item.name || item.code} berhasil dihapus.`)
  }

  // Activate period confirmation
  const activateRecord = async () => {
    if (!currentActivationItem) return

    if (isAcademic) {
      setIsActivating(true)
      try {
        const res = await academicService.activatePeriod(activeKey, currentActivationItem.id)
        if (res.success) {
          setActivationItem(null)
          setOpenMenu(null)
          onNotify(`${schema.singular} ${currentActivationItem.name} sekarang berstatus Aktif di database.`)
          setRefreshTrigger((k) => k + 1)
        } else {
          onNotify(`Gagal mengaktifkan ${schema.singular.toLowerCase()}: ${res.error}`)
        }
      } finally {
        setIsActivating(false)
      }
      return
    }

    // Non-academic
    setDatasets((current) => ({
      ...current,
      [activeKey]: (current[activeKey] ?? []).map((record) => {
        if (record.id === currentActivationItem.id) return { ...record, status: 'Aktif' }
        if (record.status === 'Aktif') return { ...record, status: 'Selesai' }
        return record
      }),
    }))
    setActivationItem(null)
    setOpenMenu(null)
    onNotify(`${schema.singular} ${currentActivationItem.name} sekarang berstatus Aktif.`)
  }

  const toggleUserStatus = (record) => {
    const nextStatus = record.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif'
    setDatasets((current) => ({
      ...current,
      [activeKey]: (current[activeKey] ?? []).map((item) =>
        item.id === record.id ? { ...item, status: nextStatus } : item,
      ),
    }))
    setOpenMenu(null)
    onNotify(`Status ${record.name} berhasil diubah menjadi ${nextStatus}.`)
  }

  return (
    <>
      <section className="master-data-workspace master-reference-workspace">
        <div className="master-data-toolbar master-reference-toolbar">
          <div className="master-filter-grid master-reference-filters">
            <label className="master-field">
              <span>{config.filterLabel}</span>
              <select
                onChange={(event) => {
                  setFilterValues((current) => ({ ...current, [activeKey]: event.target.value }))
                  setPage(1)
                }}
                value={filterValue}
              >
                <option>{config.allLabel}</option>
                {filterOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <label className="master-search">
            <SearchInput
              aria-label={schema.searchPlaceholder}
              onChange={(event) => {
                setSearchQueries((current) => ({ ...current, [activeKey]: event.target.value }))
                setPage(1)
              }}
              placeholder={schema.searchPlaceholder}
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="master-data-actions">
          <div />
          <div>
            <Button
              className="master-button secondary"
              onClick={() => onNotify(`Data ${schema.title.toLowerCase()} siap diekspor. Fitur Excel akan diintegrasikan pada tahap berikutnya.`)}
            >
              <Icon name="document" />Export Excel
            </Button>
            <Button
              className="master-button primary"
              onClick={() => setModal({ key: activeKey, type: 'add' })}
            >
              <Icon name="plus" />Tambah {schema.singular}
            </Button>
          </div>
        </div>

        {isAcademic && fetchError && (
          <div className="master-fetch-error-banner" role="alert" style={{ margin: '12px 0' }}>
            <Icon name="info" />
            <div className="master-fetch-error-content">
              <strong>Gagal Memuat Data</strong>
              <p>{fetchError}</p>
            </div>
            <Button
              className="master-button secondary"
              onClick={() => setRefreshTrigger((k) => k + 1)}
              type="button"
            >
              <Icon name="refresh" />
              Coba Lagi
            </Button>
          </div>
        )}

        <div className="master-table-heading">
          <h3>
            Daftar {schema.title} {isAcademic ? `(${totalItems} Total)` : ''}
          </h3>
        </div>

        <div className="master-table-scroll">
          <table className="master-reference-table">
            <thead>
              <tr>
                <th>No</th>
                {schema.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="master-empty-row" colSpan={schema.columns.length + 2}>
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#64748b' }}>Memuat data {schema.title.toLowerCase()} dari MariaDB...</p>
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan={schema.columns.length + 2}>
                    <Icon name="search" />
                    <strong>Data tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record, index) => {
                  const rowNumber = isAcademic
                    ? (serverMeta.current_page - 1) * serverMeta.per_page + index + 1
                    : startIndex + index + 1

                  return (
                    <tr key={record.id}>
                      <td>{rowNumber}</td>
                      {schema.columns.map((column) => {
                        const value = record[column.key] ?? '-'

                        return (
                          <td className={column.key === 'name' ? 'master-name-cell' : undefined} key={column.key}>
                            {column.key === 'status' ? (
                              <span className={`master-data-status ${toClassName(value)}`}>{value}</span>
                            ) : column.key === 'role' ? (
                              <span className={`master-role-badge ${toClassName(value)}`}>{value}</span>
                            ) : value}
                          </td>
                        )
                      })}
                      <td>
                        <div className="master-row-actions">
                          <button
                            aria-label={`Lihat ${getRecordName(record, schema)}`}
                            onClick={() => {
                              setModal({ key: activeKey, type: 'detail', item: record })
                              setOpenMenu(null)
                            }}
                            type="button"
                          >
                            <Icon name="eye" />
                          </button>
                          <button
                            aria-label={`Edit ${getRecordName(record, schema)}`}
                            onClick={() => {
                              setModal({ key: activeKey, type: 'edit', item: record })
                              setOpenMenu(null)
                            }}
                            type="button"
                          >
                            <Icon name="edit" />
                          </button>
                          <span>
                            <button
                              aria-label={`Aksi lainnya ${getRecordName(record, schema)}`}
                              onClick={() =>
                                setOpenMenu((current) =>
                                  current?.key === activeKey && current.id === record.id
                                    ? null
                                    : { key: activeKey, id: record.id },
                                )
                              }
                              type="button"
                            >
                              <Icon name="more" />
                            </button>
                            {openMenu?.key === activeKey && openMenu.id === record.id && (
                              <span className="master-action-menu">
                                <button
                                  onClick={() => {
                                    setModal({ key: activeKey, type: 'detail', item: record })
                                    setOpenMenu(null)
                                  }}
                                  type="button"
                                >
                                  Lihat Detail
                                </button>
                                <button
                                  onClick={() => {
                                    setModal({ key: activeKey, type: 'edit', item: record })
                                    setOpenMenu(null)
                                  }}
                                  type="button"
                                >
                                  Edit Data
                                </button>
                                {config.canActivate && record.status !== 'Aktif' && (
                                  <button
                                    onClick={() => {
                                      setActivationItem({ key: activeKey, item: record })
                                      setOpenMenu(null)
                                    }}
                                    type="button"
                                  >
                                    Jadikan Aktif
                                  </button>
                                )}
                                {config.canToggleStatus && (
                                  <button onClick={() => toggleUserStatus(record)} type="button">
                                    {record.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setModal({ key: activeKey, type: 'delete', item: record })
                                    setOpenMenu(null)
                                  }}
                                  style={{ color: '#ef4444' }}
                                  type="button"
                                >
                                  Hapus Data
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <MasterPagination
          currentPage={safePage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPages((current) => ({ ...current, [activeKey]: value }))
            setPage(1)
          }}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      </section>

      {['add', 'edit'].includes(currentModal?.type) && (
        <MasterEntityModal
          entityLabel={schema.singular}
          fields={activeFormFields}
          initialData={currentModal.item ?? getDefaultRecord(activeKey)}
          mode={currentModal.type}
          onClose={() => setModal(null)}
          onSave={saveRecord}
        />
      )}

      {currentModal?.type === 'detail' && (
        <MasterDetailModal
          entityLabel={schema.singular}
          name={getRecordName(currentModal.item, schema)}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ key: activeKey, type: 'edit', item: currentModal.item })}
          sections={createDetailSections(currentModal.item, schema)}
        />
      )}

      {currentModal?.type === 'delete' && (
        <MasterDeleteModal
          entityLabel={schema.singular}
          item={currentModal.item}
          onClose={() => setModal(null)}
          onConfirm={confirmDelete}
        />
      )}

      {currentActivationItem && (
        <ActivationConfirmation
          entityLabel={schema.singular}
          isActivating={isActivating}
          item={currentActivationItem}
          onClose={() => setActivationItem(null)}
          onConfirm={activateRecord}
        />
      )}
    </>
  )
}

export default MasterReferenceView
