import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import MasterMobileActionSheet from './MasterMobileActionSheet.jsx'

function MasterMobileRecordCard({
  moduleKey = 'siswa',
  record,
  onViewDetail,
  onEdit,
  onDelete,
  extraActions = [],
}) {
  const [isActionOpen, setIsActionOpen] = useState(false)

  if (!record) return null

  if (moduleKey === 'keikutsertaan' || moduleKey === 'keikutsertaan-ekstrakurikuler') {
    const studentName = record.name || 'Siswa'
    const nis = record.nis || '-'
    const classNameStr = record.className || ''
    const ekskul = record.extracurricular || '-'
    const pembina = record.supervisor && record.supervisor !== '-' ? record.supervisor : null
    const predicate = record.predicate
    const status = record.status || 'Aktif'
    const statusClass = String(status).toLowerCase().replace(/\s+/g, '-')

    return (
      <article className="master-mobile-record-card activity-record-card">
        <div className="activity-card-top">
          <div className="activity-card-title-group">
            <strong className="activity-card-student-name">{studentName}</strong>
            <span className="activity-card-code-row">NIS {nis} • {classNameStr}</span>
          </div>
          <button
            type="button"
            className="activity-card-btn-more"
            onClick={() => setIsActionOpen(true)}
            aria-label={`Aksi untuk ${studentName}`}
          >
            <Icon name="more" />
          </button>
        </div>

        <div className="activity-card-middle">
          <span className="activity-card-ekskul-tag">
            <span className="activity-card-ekskul-label">Ekskul:</span>
            <strong className="activity-card-ekskul-name">{ekskul}</strong>
          </span>
        </div>

        <div className="activity-card-bottom">
          <div className="activity-card-meta-left">
            {pembina && (
              <span className="activity-card-pembina">
                Pembina: {pembina}
              </span>
            )}
          </div>
          <div className="activity-card-badges-right">
            {predicate && (
              <span className="activity-card-predicate-chip">
                Predikat: {predicate}
              </span>
            )}
            <span className={`master-mobile-badge-chip ${statusClass}`}>
              {status}
            </span>
          </div>
        </div>

        <MasterMobileActionSheet
          extraActions={extraActions}
          isOpen={isActionOpen}
          onClose={() => setIsActionOpen(false)}
          onDelete={onDelete ? () => onDelete(record) : undefined}
          onEdit={onEdit ? () => onEdit(record) : undefined}
          onViewDetail={onViewDetail ? () => onViewDetail(record) : undefined}
          title={studentName}
        />
      </article>
    )
  }

  let name = record.name || record.code || 'Data'
  let codeStr = ''
  let detailItems = []
  let status = record.status || 'Aktif'

  if (moduleKey === 'siswa') {
    const nis = record.nis || '-'
    const nisn = record.nisn || '-'
    codeStr = `NIS ${nis} • NISN ${nisn}`
    if (record.class) detailItems.push({ label: 'Kelas', value: record.class })
    if (record.gender || record.gender_code) {
      detailItems.push({
        label: 'JK',
        value: record.gender_code || (record.gender === 'Perempuan' ? 'P' : 'L'),
      })
    }
  } else if (moduleKey === 'guru') {
    const nip = record.nip && record.nip !== '-' ? record.nip : null
    const nuptk = record.nuptk && record.nuptk !== '-' ? record.nuptk : null
    codeStr = nip ? `NIP ${nip}` : nuptk ? `NUPTK ${nuptk}` : '-'
    if (record.subject && record.subject !== '-') {
      detailItems.push({ label: 'Mapel', value: record.subject })
    }
    if (record.employment_status || record.employmentStatus) {
      detailItems.push({
        label: 'Status',
        value: record.employment_status || record.employmentStatus,
      })
    }
  } else if (moduleKey === 'kelas') {
    codeStr = record.code ? `Kode: ${record.code}` : ''
    if (record.grade || record.level) {
      detailItems.push({ label: 'Tingkat', value: record.grade || record.level })
    }
    if (record.capacity) {
      detailItems.push({ label: 'Kapasitas', value: `${record.capacity} Siswa` })
    }
  } else if (moduleKey === 'ruangan') {
    codeStr = record.code ? `Kode: ${record.code}` : ''
    if (record.room_type || record.type) {
      detailItems.push({ label: 'Tipe', value: record.room_type || record.type })
    }
    if (record.capacity) {
      detailItems.push({ label: 'Kapasitas', value: `${record.capacity} Siswa` })
    }
  } else if (moduleKey === 'mata-pelajaran') {
    codeStr = record.code ? `Kode: ${record.code}` : ''
    if (record.group) detailItems.push({ label: 'Kelompok', value: record.group })
    if (record.grade || record.grades) {
      detailItems.push({ label: 'Tingkat', value: record.grade || record.grades })
    }
  } else if (moduleKey === 'tahun-ajaran') {
    const start = record.start_date || record.startDate
    const end = record.end_date || record.endDate
    if (start && end) codeStr = `${start} s/d ${end}`
  } else if (moduleKey === 'semester') {
    const sem = record.semester ? `Semester ${record.semester}` : ''
    const year = record.academic_year || record.academicYear
    if (year) codeStr = `Tahun Ajaran: ${year}`
    if (sem && !name.toLowerCase().includes('semester')) detailItems.push({ label: 'Smt', value: sem })
  } else if (moduleKey === 'agama') {
    // Religion only has name and status
  } else if (moduleKey === 'ekstrakurikuler') {
    codeStr = record.code ? `Kode: ${record.code}` : ''
    const pembina = record.supervisor || record.teacher_name
    if (pembina && pembina !== '-') {
      detailItems.push({ label: 'Pembina', value: pembina })
    }
  } else if (moduleKey === 'pengguna-role') {
    codeStr = record.username || record.email || ''
    const roleStr = record.role || (Array.isArray(record.roles) ? record.roles.map((r) => r.name || r).join(', ') : '')
    if (roleStr) detailItems.push({ label: 'Role', value: roleStr })
  }

  const statusClass = String(status).toLowerCase().replace(/\s+/g, '-')

  return (
    <article className="master-mobile-record-card">
      <div className="master-mobile-card-top">
        <div className="master-mobile-card-title-group">
          <strong className="master-mobile-card-name">{name}</strong>
          {codeStr && <span className="master-mobile-card-code-row">{codeStr}</span>}
        </div>
        <button
          type="button"
          className="master-mobile-btn-more"
          onClick={() => setIsActionOpen(true)}
          aria-label={`Aksi untuk ${name}`}
        >
          <Icon name="more" />
        </button>
      </div>

      <div className="master-mobile-card-bottom">
        <div className="master-mobile-card-details">
          {detailItems.map((item, idx) => (
            <span key={idx} className="master-mobile-detail-tag">
              <b>{item.label}:</b> {item.value}
            </span>
          ))}
        </div>
        <span className={`master-mobile-badge-chip ${statusClass}`}>
          {status}
        </span>
      </div>

      <MasterMobileActionSheet
        extraActions={extraActions}
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        onDelete={onDelete ? () => onDelete(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onViewDetail={onViewDetail ? () => onViewDetail(record) : undefined}
        title={name}
      />
    </article>
  )
}

export default MasterMobileRecordCard
