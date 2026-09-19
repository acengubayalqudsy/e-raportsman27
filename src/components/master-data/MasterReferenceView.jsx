import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { masterDatasets, masterSchemas } from '../../data/masterData.js'
import { MasterDetailModal, MasterEntityModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'

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
    'tahun-ajaran': { status: 'Akan Datang' },
    semester: { status: 'Akan Datang' },
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

function ActivationConfirmation({ entityLabel, item, onClose, onConfirm }) {
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
            <p>Perubahan ini hanya berlaku pada local state selama simulasi frontend.</p>
          </div>
          <button aria-label="Tutup konfirmasi" onClick={onClose} type="button">&times;</button>
        </header>

        <div className="master-confirm-body">
          <span><Icon name="checkCircle" /></span>
          <div>
            <strong>{item.name}</strong>
            <p>Status aktif sebelumnya akan otomatis diubah menjadi Selesai.</p>
          </div>
        </div>

        <footer className="master-modal-footer">
          <Button className="master-button secondary" onClick={onClose}>Batal</Button>
          <Button className="master-button primary" onClick={onConfirm}>
            <Icon name="check" />Jadikan Aktif
          </Button>
        </footer>
      </section>
    </div>
  )
}

function MasterReferenceView({ activeKey, onNotify }) {
  const [datasets, setDatasets] = useState(cloneReferenceDatasets)
  const [searchQueries, setSearchQueries] = useState({})
  const [filterValues, setFilterValues] = useState({})
  const [currentPages, setCurrentPages] = useState({})
  const [rowsPerPages, setRowsPerPages] = useState({})
  const [openMenu, setOpenMenu] = useState(null)
  const [modal, setModal] = useState(null)
  const [activationItem, setActivationItem] = useState(null)

  const schema = masterSchemas[activeKey]
  const config = referenceConfig[activeKey]
  const records = datasets[activeKey] ?? emptyRecords
  const searchQuery = searchQueries[activeKey] ?? ''
  const filterValue = filterValues[activeKey] ?? config?.allLabel ?? ''
  const currentPage = currentPages[activeKey] ?? 1
  const rowsPerPage = rowsPerPages[activeKey] ?? 8

  const filterOptions = useMemo(() => {
    if (!config) return []
    return [...new Set(records.map((record) => record[config.filterKey]).filter(Boolean))]
  }, [config, records])

  const filteredRecords = useMemo(() => {
    if (!config) return []
    const query = searchQuery.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        Object.values(record).some((value) =>
          ['string', 'number'].includes(typeof value) && String(value).toLowerCase().includes(query),
        )
      const matchesFilter =
        filterValue === config.allLabel || record[config.filterKey] === filterValue

      return matchesSearch && matchesFilter
    })
  }, [config, filterValue, records, searchQuery])

  if (!schema || !config) return null

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage)
  const currentModal = modal?.key === activeKey ? modal : null
  const currentActivationItem = activationItem?.key === activeKey ? activationItem.item : null

  const setPage = (page) => {
    setCurrentPages((current) => ({ ...current, [activeKey]: page }))
  }

  const saveRecord = (formData) => {
    const source = currentModal?.item
    const nextRecord = normalizeRecord(activeKey, formData, source, records)

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
  }

  const activateRecord = () => {
    if (!currentActivationItem) return

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

        <div className="master-table-heading"><h3>Daftar {schema.title}</h3></div>
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
              {visibleRecords.length === 0 ? (
                <tr>
                  <td className="master-empty-row" colSpan={schema.columns.length + 2}>
                    <Icon name="search" />
                    <strong>Data tidak ditemukan</strong>
                    <span>Coba ubah filter atau kata pencarian.</span>
                  </td>
                </tr>
              ) : visibleRecords.map((record, index) => (
                <tr key={record.id}>
                  <td>{startIndex + index + 1}</td>
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
                          onClick={() => setOpenMenu((current) =>
                            current?.key === activeKey && current.id === record.id
                              ? null
                              : { key: activeKey, id: record.id },
                          )}
                          type="button"
                        >
                          <Icon name="more" />
                        </button>
                        {openMenu?.key === activeKey && openMenu.id === record.id && (
                          <span className="master-action-menu">
                            <button onClick={() => { setModal({ key: activeKey, type: 'detail', item: record }); setOpenMenu(null) }} type="button">Lihat Detail</button>
                            <button onClick={() => { setModal({ key: activeKey, type: 'edit', item: record }); setOpenMenu(null) }} type="button">Edit Data</button>
                            {config.canActivate && record.status !== 'Aktif' && (
                              <button onClick={() => { setActivationItem({ key: activeKey, item: record }); setOpenMenu(null) }} type="button">Jadikan Aktif</button>
                            )}
                            {config.canToggleStatus && (
                              <button onClick={() => toggleUserStatus(record)} type="button">
                                {record.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
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
          totalItems={filteredRecords.length}
          totalPages={totalPages}
        />
      </section>

      {['add', 'edit'].includes(currentModal?.type) && (
        <MasterEntityModal
          entityLabel={schema.singular}
          fields={schema.formFields}
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

      {currentActivationItem && (
        <ActivationConfirmation
          entityLabel={schema.singular}
          item={currentActivationItem}
          onClose={() => setActivationItem(null)}
          onConfirm={activateRecord}
        />
      )}
    </>
  )
}

export default MasterReferenceView
