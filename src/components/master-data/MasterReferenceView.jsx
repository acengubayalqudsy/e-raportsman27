import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { masterSchemas } from '../../data/masterData.js'
import { MasterDeleteModal, MasterDetailModal, MasterEntityModal, MasterImportModal } from './MasterModals.jsx'
import MasterPagination from './MasterPagination.jsx'
import MasterMobileToolbar from './MasterMobileToolbar.jsx'
import MasterMobileRecordList from './MasterMobileRecordList.jsx'
import academicService from '../../services/academicService.js'
import { religionService } from '../../services/religionService.js'
import { extracurricularService } from '../../services/extracurricularService.js'
import { userService } from '../../services/userService.js'
import { teacherService } from '../../services/teacherService.js'
import excelService from '../../services/excelService.js'

const excelModules = {
  kelas: 'classes', ruangan: 'rooms', 'mata-pelajaran': 'subjects', 'tahun-ajaran': 'years',
  semester: 'semesters', agama: 'religions', ekstrakurikuler: 'extracurriculars', 'pengguna-role': 'users',
}

const referenceConfig = {
  kelas: { filterKey: 'academicYear', filterLabel: 'Tahun Ajaran', allLabel: 'Semua Tahun' },
  ruangan: { filterKey: 'type', filterLabel: 'Jenis Ruangan', allLabel: 'Semua Jenis' },
  'mata-pelajaran': { filterKey: 'group', filterLabel: 'Kelompok', allLabel: 'Semua Kelompok' },
  'tahun-ajaran': { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canActivate: true },
  semester: { filterKey: 'academicYear', filterLabel: 'Tahun Ajaran', allLabel: 'Semua Tahun', canActivate: true },
  agama: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canToggleStatus: true },
  ekstrakurikuler: { filterKey: 'status', filterLabel: 'Status', allLabel: 'Semua Status', canToggleStatus: true },
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
    'tahun-ajaran': { status: 'Akan Datang' },
    semester: { status: 'Akan Datang' },
    agama: { status: 'Aktif' },
    ekstrakurikuler: { status: 'Aktif', teacher_id: '' },
    'pengguna-role': { status: 'Aktif', roles: [] },
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
        <div className="master-mobile-sheet-handle-wrapper" aria-hidden="true">
          <div className="master-mobile-sheet-handle" />
        </div>
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
      toggleStatus: (id) => religionService.toggleStatus(id),
    }
  }
  if (activeKey === 'ekstrakurikuler') {
    return {
      type: 'extracurricular',
      getItems: (params) => extracurricularService.getExtracurriculars(params),
      createItem: (data) => extracurricularService.createExtracurricular(data),
      updateItem: (id, data) => extracurricularService.updateExtracurricular(id, data),
      deleteItem: (id) => extracurricularService.deleteExtracurricular(id),
      toggleStatus: (id) => extracurricularService.toggleStatus(id),
    }
  }
  if (activeKey === 'pengguna-role') {
    return {
      type: 'user',
      getItems: (params) => userService.getUsers(params),
      createItem: (data) => userService.createUser(data),
      updateItem: (id, data) => userService.updateUser(id, data),
      deleteItem: (id) => userService.deleteUser(id),
      toggleStatus: (id) => userService.toggleStatus(id),
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
  const [showImport, setShowImport] = useState(false)
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
            setAvailableYears(res.data)
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
            setAvailableRoles(res.data)
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
    if (activeKey === 'ekstrakurikuler' || activeKey === 'pengguna-role') {
      let isMounted = true
      const loadTeachers = async () => {
        const teachers = []
        let page = 1
        while (true) {
          const result = await teacherService.getTeachers({ page, per_page: 100 })
          if (!result.success || !isMounted) return
          teachers.push(...result.data)
          if (page >= (result.meta?.last_page || 1)) break
          page += 1
        }
        if (isMounted) setAvailableTeachers(teachers)
      }
      void loadTeachers()

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
      return availableYears.map((year) => year.name)
    }
    if (activeKey === 'mata-pelajaran') return ['Umum', 'IPA', 'IPS', 'Muatan Lokal', 'Layanan']
    if (activeKey === 'tahun-ajaran') return ['Aktif', 'Tidak Aktif', 'Selesai', 'Akan Datang']
    if (activeKey === 'agama' || activeKey === 'ekstrakurikuler') {
      return ['Aktif', 'Tidak Aktif']
    }
    if (activeKey === 'pengguna-role') {
      return availableRoles.map((role) => role.display_name || role.name)
    }
    return []
  }, [activeKey, availableYears, availableRoles])

  // Dynamic form fields for modals
  const activeFormFields = useMemo(() => {
    if (!schema) return []
    if (['semester', 'kelas'].includes(activeKey)) {
      return schema.formFields.map((field) => field.key === 'academic_year_id'
        ? { ...field, options: availableYears.map((year) => ({ value: String(year.id), label: year.name })) }
        : field)
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
        { key: 'description', label: 'Deskripsi Kegiatan', type: 'textarea', fullWidth: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
      ]
    }
    if (activeKey === 'pengguna-role') {
      const isEdit = modal?.type === 'edit'
      const currentUserId = modal?.item?.id
      const teacherOptions = [
        { value: '', label: 'Tidak ditautkan' },
        ...availableTeachers.filter((teacher) => !teacher.user_id || teacher.user_id === currentUserId)
          .map((teacher) => ({ value: String(teacher.id), label: teacher.name })),
      ]
      return [
        { key: 'name', label: 'Nama Pengguna', required: true },
        { key: 'username', label: 'Username', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Nomor Telepon', type: 'tel' },
        { key: 'teacher_id', label: 'Profil Guru (jika diperlukan)', type: 'select', options: teacherOptions },
        {
          key: 'password',
          label: isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password',
          type: 'password',
          required: !isEdit,
        },
        {
          key: 'roles',
          label: 'Role',
          type: 'multiselect',
          options: availableRoles.map((role) => ({ value: role.name, label: role.display_name || role.name })),
          required: true,
        },
        { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
      ]
    }
    return schema.formFields
  }, [schema, activeKey, availableYears, availableRoles, availableTeachers, modal])

  const mobileFilterFields = useMemo(() => {
    if (!config) return []
    return [
      {
        key: config.filterKey,
        label: config.filterLabel,
        options: [config.allLabel, ...filterOptions],
      },
    ]
  }, [config, filterOptions])

  const activeFilterCount = useMemo(() => {
    if (!config || !filterValue || filterValue === config.allLabel) return 0
    return 1
  }, [config, filterValue])

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
        <div className="master-desktop-toolbar-container">
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
            {activeKey !== 'pengguna-role' && <Button className="master-button secondary" onClick={() => setShowImport(true)}>
              <Icon name="download" />Import Excel
            </Button>}
            <Button
              className="master-button secondary"
              onClick={() => excelService.download(excelModules[activeKey], 'export', {
                search: searchQuery,
                academic_year_id: availableYears.find((year) => year.name === filterValue)?.id,
                status: config.filterKey === 'status' && filterValue !== config.allLabel ? filterValue : '',
                group: config.filterKey === 'group' && filterValue !== config.allLabel ? filterValue : '',
                type: config.filterKey === 'type' && filterValue !== config.allLabel ? filterValue : '',
                role: config.filterKey === 'role' && filterValue !== config.allLabel ? filterValue : '',
              }).catch((error) => onNotify(error.message))}
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
        </div>

        <MasterMobileToolbar
          activeFilterCount={activeFilterCount}
          addLabel={`Tambah ${schema.singular}`}
          exportDisabled={visibleRecords.length === 0}
          exportLabel="Export"
          filterFields={mobileFilterFields}
          filters={{ [config.filterKey]: filterValue }}
          importLabel={activeKey !== 'pengguna-role' ? 'Import' : undefined}
          onAdd={() => setModal({ key: activeKey, type: 'add' })}
          onExport={() => excelService.download(excelModules[activeKey], 'export', {
            search: searchQuery,
            academic_year_id: availableYears.find((year) => year.name === filterValue)?.id,
            status: config.filterKey === 'status' && filterValue !== config.allLabel ? filterValue : '',
            group: config.filterKey === 'group' && filterValue !== config.allLabel ? filterValue : '',
            type: config.filterKey === 'type' && filterValue !== config.allLabel ? filterValue : '',
            role: config.filterKey === 'role' && filterValue !== config.allLabel ? filterValue : '',
          }).catch((error) => onNotify(error.message))}
          onFilterChange={(key, val) => {
            setFilterValues((current) => ({ ...current, [activeKey]: val }))
            setPage(1)
          }}
          onFilterReset={() => {
            setFilterValues((current) => ({ ...current, [activeKey]: config.allLabel }))
            setPage(1)
          }}
          onImport={activeKey !== 'pengguna-role' ? () => setShowImport(true) : undefined}
          onSearchChange={(val) => {
            setSearchQueries((current) => ({ ...current, [activeKey]: val }))
            setPage(1)
          }}
          searchPlaceholder={schema.searchPlaceholder}
          searchQuery={searchQuery}
        />

        {showImport && <MasterImportModal
          entityLabel={schema.title}
          module={excelModules[activeKey]}
          onClose={() => setShowImport(false)}
          onComplete={(count) => { setShowImport(false); setRefreshTrigger((value) => value + 1); onNotify(`${count} data ${schema.title.toLowerCase()} berhasil diperbarui.`) }}
        />}

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

        <div className="master-desktop-table-container">
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
        </div>

        <div className="master-mobile-record-container">
          <MasterMobileRecordList
            canActivate={Boolean(config.canActivate)}
            canToggleStatus={Boolean(config.canToggleStatus)}
            fetchError={fetchError}
            isLoading={isLoading}
            moduleKey={activeKey}
            onActivate={(record) => setActivationItem({ key: activeKey, item: record })}
            onDelete={(record) => setModal({ key: activeKey, type: 'delete', item: record })}
            onEdit={(record) => setModal({ key: activeKey, type: 'edit', item: record })}
            onRetry={() => setRefreshTrigger((k) => k + 1)}
            onToggleStatus={toggleUserStatus}
            onViewDetail={(record) => setModal({ key: activeKey, type: 'detail', item: record })}
            records={visibleRecords}
            totalCount={totalItems}
          />
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
                  phone: currentModal.item.phone === '-' ? '' : currentModal.item.phone,
                  roles: Array.isArray(currentModal.item.roles)
                    ? currentModal.item.roles.map((role) => role.name)
                    : [],
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
