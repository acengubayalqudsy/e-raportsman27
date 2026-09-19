import { useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  academicAnnouncements,
  academicSummary,
  scheduleOptions,
  todaySchedule,
  todayScheduleMeta,
  weeklySchedule,
} from '../../data/akademik.js'
import AcademicModal from './AcademicModal.jsx'
import AcademicSummary from './AcademicSummary.jsx'

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function normalizeOption(option) {
  if (typeof option === 'string') return { label: option, value: option }
  return { label: option.label ?? option.value, value: option.value ?? option.label }
}

function SelectField({ label, onChange, options = [], value }) {
  return (
    <label className="academic-filter-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(normalizeOption).map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function ScheduleCell({ className, day, item, onOpen, time }) {
  if (!item) return <span className="academic-schedule-empty">-</span>

  return (
    <button
      aria-label={`Lihat detail ${item.subject} hari ${day}`}
      className={`academic-schedule-cell ${className ?? ''}`}
      onClick={() => onOpen({ ...item, day: item.day ?? day, time: item.time ?? time })}
      type="button"
    >
      <strong>{item.subject}</strong>
      <span>{item.teacher}</span>
      {item.room && <small>{item.room}</small>}
    </button>
  )
}

function TodaySchedulePanel({ items, onOpen, onViewAll }) {
  return (
    <section className="academic-side-card academic-today-card">
      <header className="academic-side-card-header">
        <h3>Jadwal Hari Ini</h3>
        <span><Icon name="calendar" />{todayScheduleMeta.dateLabel}</span>
      </header>

      <div className="academic-today-list">
        {items.length ? items.map((item) => (
          <button
            className={`academic-today-item ${item.type ?? ''}`}
            key={item.id}
            onClick={() => item.type !== 'break' && onOpen({ ...item, day: item.day ?? todayScheduleMeta.day })}
            type="button"
          >
            <time>{item.time}</time>
            <span className="academic-today-copy">
              <strong>{item.subject}</strong>
              {item.type !== 'break' && (
                <small>{item.className}<i aria-hidden="true">•</i>{item.teacher}</small>
              )}
            </span>
            {item.room && <em className={item.room.toLowerCase().includes('lab') ? 'lab' : ''}>{item.room}</em>}
          </button>
        )) : (
          <EmptyState className="academic-side-empty">
            <Icon name="calendar" />
            <p>Tidak ada jadwal yang sesuai.</p>
          </EmptyState>
        )}
      </div>

      <button className="academic-side-footer-action" onClick={onViewAll} type="button">
        Lihat Jadwal Lengkap <Icon name="arrowRight" />
      </button>
    </section>
  )
}

function AnnouncementPanel({ items, onAction }) {
  return (
    <section className="academic-side-card academic-announcement-card">
      <header className="academic-side-card-header">
        <h3><Icon name="megaphone" />Pengumuman Akademik</h3>
        <button onClick={() => onAction('Daftar semua pengumuman dibuka.')} type="button">Lihat Semua</button>
      </header>

      <div className="academic-announcement-list">
        {items.map((item) => (
          <button className="academic-announcement-item" key={item.id} onClick={() => onAction(item.title)} type="button">
            <span className="academic-announcement-icon"><Icon name="megaphone" /></span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <time><b>{item.dateDay}</b>{item.dateMonth}</time>
          </button>
        ))}
      </div>

      <button className="academic-side-footer-action" onClick={() => onAction('Pengumuman akademik lainnya dibuka.')} type="button">
        Lihat Pengumuman Lainnya <Icon name="arrowRight" />
      </button>
    </section>
  )
}

function ScheduleDetail({ item, onClose, onEdit }) {
  if (!item) return null

  const details = [
    ['Mata Pelajaran', item.subject],
    ['Guru', item.teacher],
    ['Kelas', item.className],
    ['Hari', item.day],
    ['Jam', item.time],
    ['Ruangan', item.room],
  ]

  return (
    <AcademicModal description={`${item.day ?? ''}${item.time ? `, ${item.time}` : ''}`} onClose={onClose} title="Detail Jadwal">
      <div className="academic-schedule-detail">
        <span className="academic-schedule-detail-icon"><Icon name="calendar" /></span>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>
          ))}
        </dl>
      </div>
      <footer className="academic-modal-footer">
        <Button className="academic-button secondary" onClick={onEdit}><Icon name="edit" />Edit Jadwal</Button>
        <Button className="academic-button primary" onClick={onClose}>Tutup</Button>
      </footer>
    </AcademicModal>
  )
}

function AcademicScheduleView({ onNotify }) {
  const classOptions = scheduleOptions.classes ?? []
  const gradeOptions = scheduleOptions.grades ?? []
  const semesterOptions = scheduleOptions.semesters ?? []
  const dayOptions = scheduleOptions.days ?? ['Semua Hari', ...DEFAULT_DAYS]
  const scheduleDays = weeklySchedule.days ?? DEFAULT_DAYS

  const [selectedClass, setSelectedClass] = useState(weeklySchedule.className ?? normalizeOption(classOptions[0] ?? '').value)
  const [selectedGrade, setSelectedGrade] = useState(normalizeOption(gradeOptions[0] ?? 'X').value)
  const [selectedSemester, setSelectedSemester] = useState(weeklySchedule.semester ?? normalizeOption(semesterOptions[0] ?? '').value)
  const [selectedDay, setSelectedDay] = useState(normalizeOption(dayOptions[0] ?? 'Semua Hari').value)
  const [query, setQuery] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const notify = (message) => {
    onNotify?.(message)
  }

  const selectClass = (className) => {
    setSelectedClass(className)
    setSelectedGrade(className.split(' ')[0])
  }

  const selectGrade = (grade) => {
    setSelectedGrade(grade)
    const matchingClass = classOptions
      .map(normalizeOption)
      .find((option) => option.value.split(' ')[0] === grade)
    if (matchingClass) setSelectedClass(matchingClass.value)
  }

  const visibleDays = selectedDay === 'Semua Hari' ? scheduleDays : scheduleDays.filter((day) => day === selectedDay)
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const contextMatches = selectedClass === weeklySchedule.className
    && (!weeklySchedule.semester || selectedSemester === weeklySchedule.semester)
    && (!selectedGrade || selectedClass.startsWith(selectedGrade))

  const visibleRows = !contextMatches
    ? []
    : !normalizedQuery
      ? weeklySchedule.rows
      : weeklySchedule.rows.filter((row) => row.isBreak || visibleDays.some((day) => {
          const item = row.slots?.[day]
          return item && `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
        }))

  const visibleTodaySchedule = !contextMatches || (selectedDay !== 'Semua Hari' && selectedDay !== todayScheduleMeta.day)
    ? []
    : todaySchedule.filter((item) => {
        if (item.type === 'break' || !normalizedQuery) return true
        return `${item.subject} ${item.teacher} ${item.className} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
      })

  const cellMatches = (item) => {
    if (!item || !normalizedQuery) return true
    return `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
  }

  return (
    <div className="academic-schedule-view">
      <AcademicSummary items={academicSummary} />

      <section className="academic-filter-card" aria-label="Filter jadwal pelajaran">
        <div className="academic-filter-row">
          <div className="academic-filter-fields">
            <SelectField label="Kelas" onChange={selectClass} options={classOptions} value={selectedClass} />
            <SelectField label="Tingkat" onChange={selectGrade} options={gradeOptions} value={selectedGrade} />
            <SelectField label="Semester" onChange={setSelectedSemester} options={semesterOptions} value={selectedSemester} />
            <SelectField label="Hari" onChange={setSelectedDay} options={dayOptions} value={selectedDay} />
          </div>

          <label className="academic-schedule-search">
            <SearchInput
              aria-label="Cari mata pelajaran atau guru"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari mata pelajaran / guru..."
              value={query}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="academic-filter-actions">
          <Button className="academic-button secondary" onClick={() => notify('Filter lanjutan siap digunakan pada tahap frontend.')}><Icon name="filter" />Filter Lanjutan</Button>
          <Button className="academic-button secondary" onClick={() => notify('Jadwal berhasil disiapkan untuk ekspor.')}><Icon name="download" />Ekspor Jadwal</Button>
          <Button className="academic-button primary" onClick={() => notify('Jadwal berhasil disiapkan untuk dicetak.')}><Icon name="printer" />Cetak Jadwal</Button>
        </div>
      </section>

      <div className="academic-schedule-layout">
        <section className="academic-schedule-card">
          <header className="academic-schedule-card-header">
            <h2>Jadwal Pelajaran - {selectedClass}</h2>
          </header>

          {visibleRows.length ? (
            <div className="academic-weekly-scroll">
              <table className="academic-weekly-table">
                <thead>
                  <tr>
                    <th>Jam</th>
                    {visibleDays.map((day) => <th key={day}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr className={row.isBreak ? 'academic-break-row' : ''} key={row.id}>
                      <th scope="row">
                        <strong>{row.period}</strong>
                        <span>{row.time}</span>
                      </th>
                      {visibleDays.map((day) => {
                        const item = row.slots?.[day]
                        if (row.isBreak) return <td key={day}><span className="academic-break-label">{item?.subject ?? 'Istirahat'}</span></td>
                        return <td key={day}><ScheduleCell className={!cellMatches(item) ? 'muted' : ''} day={day} item={cellMatches(item) ? item : null} onOpen={setSelectedSchedule} time={row.time} /></td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="academic-schedule-empty-state">
              <Icon name="calendar" />
              <h3>Jadwal tidak ditemukan</h3>
              <p>Ubah filter kelas, semester, hari, atau kata pencarian.</p>
            </EmptyState>
          )}

          <div className="academic-schedule-note"><Icon name="info" /><strong>Catatan:</strong> Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah.</div>
        </section>

        <aside className="academic-schedule-sidebar">
          <TodaySchedulePanel items={visibleTodaySchedule} onOpen={setSelectedSchedule} onViewAll={() => notify('Jadwal lengkap ditampilkan pada tabel mingguan.')} />
          <AnnouncementPanel items={academicAnnouncements} onAction={notify} />
        </aside>
      </div>

      <ScheduleDetail
        item={selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        onEdit={() => {
          setSelectedSchedule(null)
          notify('Form edit jadwal siap digunakan pada tahap frontend.')
        }}
      />

    </div>
  )
}

export default AcademicScheduleView
