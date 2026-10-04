import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import MasterMobileActionSheet from '../master-data/MasterMobileActionSheet.jsx'

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) {
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return dateStr
  } catch {
    return dateStr
  }
}

function JournalMobileRecordCard({
  journal,
  mode = 'jurnal',
  onEdit,
  onDelete,
}) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  const statusClass =
    journal.status === 'Lengkap'
      ? 'status-success'
      : journal.status === 'Perlu Diperiksa'
      ? 'status-warning'
      : 'status-neutral'

  return (
    <article className="journal-mobile-card">
      {/* Top Row: Date & Action Overflow Button */}
      <div className="journal-mobile-card-header">
        <div className="journal-mobile-card-date">
          <Icon name="calendar" className="journal-mobile-date-icon" />
          <span className="journal-mobile-date-text">{formatDisplayDate(journal.date)}</span>
        </div>

        <button
          type="button"
          className="journal-mobile-card-more-btn"
          onClick={() => setIsActionSheetOpen(true)}
          aria-label={`Aksi untuk jurnal pertemuan ${journal.meeting} kelas ${journal.class_name}`}
        >
          <Icon name="moreVertical" />
        </button>
      </div>

      {/* Main Info: Class & Subject / Teacher */}
      <div className="journal-mobile-card-body">
        <h4 className="journal-mobile-card-class">{journal.class_name}</h4>
        <p className="journal-mobile-card-subject">
          {journal.subject_name}
          {journal.teacher_name && <span className="journal-mobile-teacher-separator"> · </span>}
          {journal.teacher_name && <span className="journal-mobile-teacher">{journal.teacher_name}</span>}
        </p>

        {/* Chips row: Meeting and Status */}
        <div className="journal-mobile-card-meta-row">
          <span className="journal-mobile-meeting-badge">
            Pertemuan {journal.meeting}
          </span>
          <span className={`journal-mobile-status-badge ${statusClass}`}>
            {journal.status || 'Belum Lengkap'}
          </span>
        </div>

        {/* Dynamic Detail Content depending on Active Mode */}
        <div className="journal-mobile-card-detail">
          {mode === 'jurnal' && (
            <>
              <div className="journal-mobile-detail-item">
                <span className="journal-mobile-detail-label">Materi:</span>
                <span className="journal-mobile-detail-val">{journal.material || 'Belum diisi'}</span>
              </div>
              {journal.activities && (
                <div className="journal-mobile-detail-item">
                  <span className="journal-mobile-detail-label">Aktivitas:</span>
                  <span className="journal-mobile-detail-val">{journal.activities}</span>
                </div>
              )}
            </>
          )}

          {mode === 'materi' && (
            <>
              <div className="journal-mobile-detail-item">
                <span className="journal-mobile-detail-label">Materi:</span>
                <span className="journal-mobile-detail-val">{journal.material || 'Belum diisi'}</span>
              </div>
              {[journal.chapter, journal.method, journal.media].some(Boolean) && (
                <div className="journal-mobile-detail-sub">
                  {[journal.chapter, journal.method, journal.media].filter(Boolean).join(' · ')}
                </div>
              )}
            </>
          )}

          {mode === 'aktivitas-kelas' && (
            <>
              <div className="journal-mobile-detail-item">
                <span className="journal-mobile-detail-label">Aktivitas:</span>
                <span className="journal-mobile-detail-val">{journal.activities || 'Belum diisi'}</span>
              </div>
              {journal.attendance_total > 0 && (
                <div className="journal-mobile-detail-sub">
                  <Icon name="users" className="journal-mobile-sub-icon" />
                  Kehadiran: {journal.attendance_present} / {journal.attendance_total} Siswa
                </div>
              )}
            </>
          )}

          {mode === 'catatan' && (
            <div className="journal-mobile-detail-item">
              <span className="journal-mobile-detail-label">Catatan:</span>
              <span className="journal-mobile-detail-val">{journal.notes || 'Belum diisi'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bottom Sheet */}
      <MasterMobileActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title={`Aksi Pertemuan ${journal.meeting} (${journal.class_name})`}
        onEdit={onEdit ? () => onEdit(journal) : null}
        onDelete={onDelete ? () => onDelete(journal) : null}
      />
    </article>
  )
}

export default JournalMobileRecordCard
