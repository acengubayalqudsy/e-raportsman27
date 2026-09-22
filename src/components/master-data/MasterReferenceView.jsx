import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { masterSchemas, masterOptions } from '../../data/masterData.js'
import { MasterDeleteModal, MasterDetailModal, MasterEntityModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import academicService from '../../services/academicService.js'
import { religionService } from '../../services/religionService.js'
import { extracurricularService } from '../../services/extracurricularService.js'
import { userService } from '../../services/userService.js'
import { teacherService } from '../../services/teacherService.js'

const referenceConfig = {
  kelas: { filterKey: 'academicYear', filterLabel: 'Tahun Ajaran', allLabel: 'Semua Tahun' },
  ruangan: { filterKey: 'type', filterLabel: 'Jenis Ruangan', allLabel: 'Semua Jenis' },
  'mata-pelajaran': { filterKey: 'group', filterLabel: 'Kelompok', allLabel: 'Semua Kelompok' },
  'tahun-ajaran': { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canActivate: true },
  semester: { filterKey: 'academicYear', filterLabel: 'Tahun Ajaran', allLabel: 'Semua Tahun', canActivate: true },
  agama: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canToggleStatus: true },
  ekstrakurikuler: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status' },
  'pengguna-role': { filterKey: 'role', filterLabel: 'Role', allLabel: 'Semua Role', canToggleStatus: true },
}

function getRecordName(record, schema) {
  if (!record) return schema.singular
  return record.name || record.code || schema.singular
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
    ekstrakurikuler: { status: 'Aktif', teacher_id: '' },
    'pengguna-role': { status: 'Aktif', role: 'Guru' },
  }

  return defaults[activeKey] ?? {}
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

function getModuleService(activeKey) {
  if (academicService.isAcademicKey(activeKey)) {
    return {
      type: 'academic',
      getItems: (params) => academicService.getItems(activeKey, params),
      createItem: (data) => academicService.createItem(activeKey, data),
      updateItem: (id, data) => academicService.updateItem(activeKey, id, data),
      deleteItem: (id) => academicService.deleteItem(activeKey, id),
      activatePeriod: (id) => academicService.activatePeriod(activeKey, id),
    }
  }
  if (activeKey === 'agama') {
    return {
      type: 'religion',
      getItems: (params) => religionService.getReligions(params),
      createItem: (data) => religionService.createReligion(data),
      updateItem: (id, data) => religionService.updateReligion(id, data),
      deleteItem: (id) => religionService.deleteReligion(id),
      toggleStatus: (id) => religionService.toggleReligionStatus(id),
    }
  }
  if (activeKey === 'ekstrakurikuler') {
    return {
      type: 'extracurricular',
      getItems: (params) => extracurricularService.getExtracurriculars(params),
      createItem: (data) => extracurricularService.createExtracurricular(data),
      updateItem: (id, data) => extracurricularService.updateExtracurricular(id, data),
      deleteItem: (id) => extracurricularService.deleteExtracurricular(id),
    }
  }
  if (activeKey === 'pengguna-role') {
    return {
      type: 'user',
      getItems: (params) => userService.getUsers(params),
      createItem: (data) => userService.createUser(data),
      updateItem: (id, data) => userService.updateUser(id, data),
      deleteItem: (id) => userService.deleteUser(id),
      toggleStatus: (id) => userService.toggleUserStatus(id),
    }
  }
  return null
}

function MasterReferenceView({ activeKey, onNotify }) {
  // Server state for all master data
  const [serverRecords, setServerRecords] = useState([])
  const [serverMeta, setServerMeta] = useState({ current_page: 1, last_page: 1, per_page: 8, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [availableYears, setAvailableYears] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [availableTeachers, setAvailableTeachers] = useState([])
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
  const currentService = useMemo(() => getModuleService(activeKey), [activeKey])

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

  // Load available roles from backend for user management
  useEffect(() => {
    if (activeKey === 'pengguna-role') {
      let isMounted = true
      userService
        .getRoles()
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            const names = res.data.map((r) => r.display_name || r.name)
            if (names.length > 0) setAvailableRoles(names)
          }
        })
        .catch(() => {})

      return () => {
        isMounted = false
      }
    }
  }, [activeKey])

  // Load available teachers from backend for extracurricular supervisor selection
  useEffect(() => {
    if (activeKey === 'ekstrakurikuler') {
      let isMounted = true
      teacherService
        .getTeachers({ per_page: 100 })
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            setAvailableTeachers(res.data)
          }
        })
        .catch(() => {})

      return () => {
        isMounted = false
      }
    }
  }, [activeKey, refreshTrigger])

  // Fetch real data from MariaDB via REST API
  useEffect(() => {
    if (!currentService) return

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

      currentService
        .getItems(params)
        .then((res) => {
          if (!isMounted) return
          if (res.success) {
            setServerRecords(res.data)
            setServerMeta(res.meta || { current_page: 1, last_page: 1, per_page: rowsPerPage, total: res.data.length })
            setFetchError(null)
          } else {
            setFetchError(res.error || 'Gagal memuat data dari database.')
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
  }, [activeKey, currentService, currentPage, rowsPerPage, searchQuery, filterValue, refreshTrigger, config])

  // Computed filter options
  const filterOptions = useMemo(() => {
    if (activeKey === 'kelas' || activeKey === 'semester') {
      if (availableYears.length > 0) return availableYears
      return masterOptions.academicYears || []
    }
    if (activeKey === 'mata-pelajaran') return ['Umum', 'IPA', 'IPS', 'Muatan Lokal', 'Layanan']
    if (activeKey === 'tahun-ajaran') return ['Aktif', 'Tidak Aktif', 'Selesai', 'Akan Datang']
    if (activeKey === 'agama' || activeKey === 'ekstrakurikuler') {
      return ['Aktif', 'Tidak Aktif']
    }
    if (activeKey === 'pengguna-role') {
      return availableRoles.length > 0 ? availableRoles : ['Admin', 'Guru', 'Wali Kelas', 'Kepala Sekolah', 'Siswa']
    }
    return []
  }, [activeKey, availableYears, availableRoles])

  // Dynamic form fields for modals
  const activeFormFields = useMemo(() => {
    if (!schema) return []
    if (['semester', 'kelas'].includes(activeKey) && availableYears.length > 0) {
      return schema.formFields.map((f) => (f.key === 'academicYear' ? { ...f, options: availableYears } : f))
    }
    if (activeKey === 'agama') {
      return [
        { key: 'name', label: 'Nama Agama', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
      ]
    }
    if (activeKey === 'ekstrakurikuler') {
      const currentTeacherId = modal?.item?.teacher_id
      const hasCurrentTeacher = !currentTeacherId || availableTeachers.some((t) => String(t.id) === String(currentTeacherId))
      const extraOptions = (!hasCurrentTeacher && currentTeacherId && modal?.item?.supervisor && modal.item.supervisor !== '-')
        ? [{ value: String(currentTeacherId), label: modal.item.supervisor }]
        : []

      const teacherOptions = [
        { value: '', label: 'Tanpa Pembina / Belum Ditentukan' },
        ...extraOptions,
        ...availableTeachers.map((t) => ({
          value: String(t.id),
          label: `${t.name}${t.nip && t.nip !== '-' ? ` (${t.nip})` : ''}`,
        })),
      ]

      return [
        { key: 'code', label: 'Kode Ekstrakurikuler', required: true },
        { key: 'name', label: 'Nama Ekstrakurikuler', required: true },
        { key: 'teacher_id', label: 'Pembina', type: 'select', options: teacherOptions },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
      ]
    }
    if (activeKey === 'pengguna-role') {
      const isEdit = modal?.type === 'edit'
      return [
        { key: 'name', label: 'Nama Pengguna', required: true },
        { key: 'username', label: 'Email / Username', required: true },
        {
          key: 'password',
          label: isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password',
          type: 'password',
          required: !isEdit,
        },
        {
          key: 'role',
          label: 'Role',
          type: 'select',
          options: availableRoles.length > 0 ? availableRoles : ['Admin', 'Guru', 'Wali Kelas', 'Kepala Sekolah', 'Siswa'],
          required: true,
        },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
      ]
    }
    return schema.formFields
  }, [schema, activeKey, availableYears, availableRoles, availableTeachers, modal])

  if (!schema || !config) return null

  // Pagination calculation
  const totalItems = serverMeta.total
  const totalPages = Math.max(1, serverMeta.last_page)
  const safePage = Math.min(currentPage, totalPages)
  const visibleRecords = serverRecords

  const currentModal = modal?.key === activeKey ? modal : null
  const currentActivationItem = activationItem?.key === activeKey ? activationItem.item : null

  const setPage = (page) => {
    setCurrentPages((current) => ({ ...current, [activeKey]: page }))
  }

  // Save record (Create or Update)
  const saveRecord = async (formData) => {
    const source = currentModal?.item
    if (!currentService) return { success: false, error: 'Layanan modul tidak ditemukan.' }

    if (source) {
      const res = await currentService.updateItem(source.id, formData)
      if (!res.success) {
        return res
      }
      setModal(null)
      onNotify(`${schema.singular} ${formData.name || formData.code || ''} berhasil diperbarui di database.`)
      setRefreshTrigger((k) => k + 1)
      return res
    }

    const res = await currentService.createItem(formData)
    if (!res.success) {
      return res
    }
    setModal(null)
    onNotify(`${schema.singular} ${formData.name || formData.code || ''} berhasil ditambahkan ke database.`)
    setPage(1)
    setRefreshTrigger((k) => k + 1)
    return res
  }

  // Delete confirmation
  const confirmDelete = async (item) => {
    if (!currentService) return

    const res = await currentService.deleteItem(item.id)
    if (res.success) {
      setModal(null)
      onNotify(`Data ${schema.singular} ${item.name || item.code} berhasil dihapus dari database.`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(`Gagal menghapus ${schema.singular.toLowerCase()}: ${res.error}`)
    }
  }

  // Activate period confirmation (for academic year & semester)
  const activateRecord = async () => {
    if (!currentActivationItem || !currentService?.activatePeriod) return

    setIsActivating(true)
    try {
      const res = await currentService.activatePeriod(currentActivationItem.id)
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
  }

  // Toggle user/record status
  const toggleUserStatus = async (record) => {
    if (!currentService?.toggleStatus) return

    const res = await currentService.toggleStatus(record.id)
    if (res.success) {
      setOpenMenu(null)
      const nextStatus = record.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif'
      onNotify(`Status ${record.name} berhasil diubah menjadi ${nextStatus}.`)
      setRefreshTrigger((k) => k + 1)
    } else {
      onNotify(`Gagal mengubah status ${record.name}: ${res.error}`)
    }
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

        {fetchError && (
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
            Daftar {schema.title} ({totalItems} Total)
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
                  const rowNumber = (serverMeta.current_page - 1) * serverMeta.per_page + index + 1

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
          initialData={
            currentModal.item
              ? {
                  ...currentModal.item,
                  teacher_id: currentModal.item.teacher_id ? String(currentModal.item.teacher_id) : '',
                }
              : getDefaultRecord(activeKey)
          }
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
