import Icon from '../common/Icon.jsx'
import Button from '../common/Button.jsx'
import MasterMobileRecordCard from './MasterMobileRecordCard.jsx'

const moduleLabels = {
  siswa: 'Siswa',
  guru: 'Guru',
  kelas: 'Kelas',
  ruangan: 'Ruangan',
  'mata-pelajaran': 'Mata Pelajaran',
  'tahun-ajaran': 'Tahun Ajaran',
  semester: 'Semester',
  agama: 'Agama',
  ekstrakurikuler: 'Ekstrakurikuler',
  'pengguna-role': 'Pengguna & Role',
}

function MasterMobileRecordList({
  moduleKey = 'siswa',
  records = [],
  isLoading = false,
  fetchError = null,
  onRetry,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
  onActivate,
  canActivate = false,
  canToggleStatus = false,
  totalCount = 0,
}) {
  const entityTitle = moduleLabels[moduleKey] || 'Data'

  if (fetchError) {
    return (
      <div className="master-mobile-record-container">
        <div className="master-fetch-error-banner" role="alert">
          <Icon name="info" />
          <div className="master-fetch-error-content">
            <strong>Gagal Memuat Data</strong>
            <p>{fetchError}</p>
          </div>
          {onRetry && (
            <Button
              type="button"
              className="master-button secondary"
              onClick={onRetry}
            >
              <Icon name="refresh" />
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="master-mobile-record-container">
      <div className="master-mobile-list-header">
        <h4 className="master-mobile-list-title">Daftar {entityTitle}</h4>
        <span className="master-mobile-list-count">
          {totalCount} data
        </span>
      </div>

      {isLoading ? (
        <div className="master-mobile-loading-card">
          <div className="master-spinner" style={{ borderColor: '#a7f3d0', borderTopColor: '#07895a', width: '22px', height: '22px' }} />
          <p>Memuat data {entityTitle.toLowerCase()}...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="master-mobile-empty-card">
          <Icon name="search" />
          <strong>Data tidak ditemukan</strong>
          <span>Coba sesuaikan filter atau kata kunci pencarian.</span>
        </div>
      ) : (
        <div className="master-mobile-record-items">
          {records.map((record) => {
            const extraActions = []

            if (canActivate && record.status !== 'Aktif' && onActivate) {
              extraActions.push({
                label: 'Jadikan Aktif',
                icon: 'checkCircle',
                onClick: () => onActivate(record),
              })
            }

            if (canToggleStatus && onToggleStatus) {
              const isSiswa = moduleKey === 'siswa'
              const isAktif = record.status === 'Aktif'
              extraActions.push({
                label: isSiswa ? (isAktif ? 'Arsipkan' : 'Aktifkan') : (isAktif ? 'Nonaktifkan' : 'Aktifkan'),
                icon: isSiswa ? (isAktif ? 'archive' : 'checkCircle') : (isAktif ? 'slash' : 'checkCircle'),
                onClick: () => onToggleStatus(record),
              })
            }

            return (
              <MasterMobileRecordCard
                key={record.id}
                extraActions={extraActions}
                moduleKey={moduleKey}
                onDelete={onDelete}
                onEdit={onEdit}
                onViewDetail={onViewDetail}
                record={record}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MasterMobileRecordList
