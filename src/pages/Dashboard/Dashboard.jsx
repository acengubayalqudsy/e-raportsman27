import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import { activities, announcements, attendanceData, scheduleRows, stats, getRoleDashboardConfig } from '../../data/dashboard.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { canAccessModule } from '../../constants/roles.js'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import MobileAcademicSheet from '../../components/layout/MobileAcademicSheet.jsx'

function formatDate(date) {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/* ==========================================================================
   MOBILE MENU UTAMA (Canonical Modules for All Roles, Role-Filtered)
   Inspired by Edlink "MyAcademic" Lightweight Icon-Grid Pattern
   ========================================================================== */
const CANONICAL_ADMIN_MODULES = [
  {
    key: 'master-data',
    label: 'Master Data',
    icon: 'layers',
    route: '/master-data/siswa',
    tone: 'teal',
  },
  {
    key: 'akademik',
    label: 'Akademik',
    icon: 'academic',
    route: '/akademik/jadwal-pelajaran',
    tone: 'blue',
  },
  {
    key: 'penilaian',
    label: 'Penilaian',
    icon: 'grade',
    route: '/penilaian/input-nilai',
    tone: 'green',
  },
  {
    key: 'rapor-leger',
    label: 'Rapor & Leger',
    icon: 'report',
    route: '/rapor-leger',
    tone: 'emerald',
  },
  {
    key: 'kegiatan-siswa',
    label: 'Kegiatan Siswa',
    icon: 'cap',
    route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
    tone: 'amber',
  },
  {
    key: 'absensi',
    label: 'Absensi',
    icon: 'clipboardCheck',
    route: '/absensi/rekap',
    tone: 'orange',
  },
  {
    key: 'jurnal-mengajar',
    label: 'Jurnal Mengajar',
    icon: 'journal',
    route: '/jurnal-mengajar/jurnal',
    tone: 'indigo',
  },
  {
    key: 'laporan',
    label: 'Laporan',
    icon: 'document',
    route: '/laporan',
    tone: 'purple',
  },
  {
    key: 'pengaturan',
    label: 'Pengaturan',
    icon: 'settings',
    route: '/pengaturan/identitas-sekolah',
    tone: 'gray',
  },
  {
    key: 'jelajah',
    label: 'Jelajah Berita',
    icon: 'rocket',
    route: '/jelajah',
    tone: 'teal',
  },
]

function MobileMenuGrid({ roles = [] }) {
  const items = CANONICAL_ADMIN_MODULES.filter((item) => canAccessModule(roles, item.key))

  if (items.length === 0) return null

  return (
    <section className="edlink-menu-section" aria-label="Menu Utama">
      <div className="edlink-section-header">
        <h3 className="edlink-section-title">Menu Utama</h3>
        <span className="edlink-section-desc">Akses cepat fitur E-Raport</span>
      </div>

      <div className="edlink-menu-grid">
        {items.map((item) => (
          <Link key={item.key} to={item.route} className="edlink-menu-tile">
            <div className={`edlink-icon-tile tone-${item.tone}`}>
              <Icon name={item.icon} />
            </div>
            <span className="edlink-tile-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ==========================================================================
   MOBILE GREETING & CONTEXT SECTION
   Lightweight, no heavy cards, with compact date and academic chip
   ========================================================================== */
function MobileGreetingContext({ date, onOpenAcademic }) {
  const { selectedYear, selectedSemester, activeAcademicYear, activeSemester, isLoading } =
    useAcademicContext()

  const rawYear = selectedYear?.name || activeAcademicYear?.name || (isLoading ? '...' : '2024/2025')
  const rawSem = selectedSemester?.name || activeSemester?.name || (isLoading ? '...' : 'Genap')
  const cleanSem = rawSem.replace(/^semester\s*/i, '')
  const semDisplay = `Semester ${cleanSem}`

  return (
    <section className="mobile-greeting-section" aria-label="Informasi Konteks">
      <div className="mobile-context-pills-row">
        <div className="mobile-context-pill date-pill-mobile">
          <Icon name="calendar" className="mobile-context-icon" />
          <span>{date}</span>
        </div>

        <button
          type="button"
          className="mobile-context-pill academic-pill-mobile"
          onClick={onOpenAcademic}
          aria-label={`Tahun Ajaran ${rawYear} ${semDisplay}. Tekan untuk mengubah.`}
          title="Ubah Tahun Ajaran dan Semester"
        >
          <Icon name="calendar" className="mobile-context-icon green" />
          <span className="mobile-context-academic-text">{rawYear} • {semDisplay}</span>
          <Icon name="chevron" className="mobile-context-chevron" />
        </button>
      </div>
    </section>
  )
}

/* ==========================================================================
   MOBILE SECONDARY STATS (Placed AFTER Menu Utama, 2 Columns, No Fake Trends)
   ========================================================================== */
function MobileStatsGrid({ stats = [] }) {
  if (!stats || stats.length === 0) return null

  return (
    <section className="mobile-stats-section" aria-label="Ringkasan Data">
      <div className="edlink-section-header">
        <h3 className="edlink-section-title">Ringkasan Data</h3>
        <span className="edlink-section-desc">Statistik terkini tahun ajaran aktif</span>
      </div>

      <div className="mobile-stats-grid">
        {stats.map((stat) => (
          <div key={stat.title} className="mobile-stat-card">
            <div className={`mobile-stat-icon tone-${stat.tone}`}>
              <Icon name={stat.icon} />
            </div>
            <div className="mobile-stat-data">
              <strong className="mobile-stat-value">{stat.value}</strong>
              <span className="mobile-stat-title">{stat.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ==========================================================================
   DESKTOP COMPONENTS (Role-Tailored using Admin Design System)
   ========================================================================== */
function DashboardHeader({ date, userName, subtitle }) {
  return (
    <section className="dashboard-header">
      <div>
        <h2>Selamat datang, {userName} <span aria-hidden="true">{'\u{1F44B}'}</span></h2>
        <p>{subtitle || 'Kelola data akademik dengan mudah dan terintegrasi'}</p>
      </div>
      <div className="date-pill">
        <Icon name="calendar" />
        <span>{date}</span>
      </div>
    </section>
  )
}

function StatCard({ stat }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${stat.tone}`}>
        <Icon name={stat.icon} />
      </div>
      <div className="stat-copy">
        <span>{stat.title}</span>
        <strong>{stat.value}</strong>
        <p className={stat.neutral ? 'neutral' : ''}>
          {stat.neutral ? '-' : '+'} {stat.trend}
        </p>
      </div>
      <svg className={`sparkline ${stat.tone}`} viewBox="0 0 50 38" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${stat.path} L48 38 L2 38 Z`} className="spark-fill" />
        <path d={stat.path} className="spark-stroke" />
      </svg>
    </article>
  )
}

function Panel({ title, icon, actionText, href, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <Icon name={icon} />
          <h3>{title}</h3>
        </div>
        {actionText && href && (
          <Link className="panel-action" to={href}>
            {actionText}
          </Link>
        )}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function TodaySchedule({ config }) {
  const title = config?.scheduleTitle || 'Jadwal Hari Ini'
  const actionText = config?.scheduleActionText || null
  const href = config?.scheduleActionHref || null

  return (
    <Panel title={title} icon="calendar" actionText={actionText} href={href}>
      <div className="schedule-list">
        {scheduleRows.map((row) => (
          <article className="schedule-row" key={`${row.time}-${row.subject}`}>
            <time>{row.time}</time>
            <span className="dot">-</span>
            <div>
              <strong>{row.subject}</strong>
              <p>
                {row.className}
                <span>{'\u2022'}</span>
                {row.teacher}
              </p>
            </div>
            <span className={`room-badge ${row.tone}`}>{row.room}</span>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function AttendanceOverview({ config }) {
  const title = config?.attendanceTitle || 'Absensi Siswa Hari Ini'
  const actionText = config?.attendanceActionText || null
  const href = config?.attendanceActionHref || null

  const total = attendanceData.reduce((sum, item) => sum + item.value, 0)
  const gradient = useMemo(() => {
    return attendanceData
      .reduce(
        (acc, item) => {
          const start = acc.offset
          const end = start + (item.value / total) * 100

          return {
            offset: end,
            parts: [...acc.parts, `${item.color} ${start}% ${end}%`],
          }
        },
        { offset: 0, parts: [] },
      )
      .parts.join(', ')
  }, [total])

  return (
    <Panel title={title} icon="grade" actionText={actionText} href={href}>
      <div className="attendance-content">
        <div className="donut" style={{ '--donut-gradient': gradient }}>
          <div>
            <span>Total</span>
            <strong>1.248</strong>
            <small>siswa</small>
          </div>
        </div>

        <div className="attendance-list">
          {attendanceData.map((item) => (
            <div className="attendance-item" key={item.label}>
              <span className="attendance-dot" style={{ background: item.color }} />
              <strong>{item.label}</strong>
              <span>{item.value.toLocaleString('id-ID')} siswa</span>
              <b style={{ color: item.color }}>{item.percent}</b>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function RecentActivities() {
  return (
    <Panel title="Aktivitas Terbaru" icon="calendar">
      <div className="activity-list">
        {activities.map((activity) => (
          <article className="activity-row" key={activity.title}>
            <span className={`activity-icon ${activity.tone}`}>
              <Icon name={activity.icon} />
            </span>
            <div>
              <strong>{activity.title}</strong>
              <p>
                {activity.meta}
                <span>{'\u2022'}</span>
                {activity.time}
              </p>
            </div>
            <span className={`category-badge ${activity.tone}`}>{activity.category}</span>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function SchoolAnnouncements() {
  return (
    <Panel title="Pengumuman Sekolah" icon="megaphone" actionText="Lihat Semua" href="/pengumuman">
      <div className="announcement-list">
        {announcements.map((announcement) => (
          <a className="announcement-row" href="/pengumuman/1" key={announcement.title}>
            <span className="announcement-icon">
              <Icon name="megaphone" />
            </span>
            <span className="announcement-copy">
              <strong>{announcement.title}</strong>
              <p>{announcement.summary}</p>
            </span>
            <span className="announcement-date">
              <strong>{announcement.day}</strong>
              <small>{announcement.month}</small>
            </span>
          </a>
        ))}
      </div>
    </Panel>
  )
}

/* ==========================================================================
   MAIN DASHBOARD EXPORT
   Adaptive branching: Mobile (<= 767px) vs Desktop/Tablet (>= 768px)
   ========================================================================== */
function Dashboard() {
  const currentDate = useMemo(() => formatDate(new Date()), [])
  const { user, roles } = useAuth()
  const userName = user?.name ? user.name.split(' ')[0] : 'Pengguna'
  const primaryRole = user?.primaryRole || ''
  const roleConfig = useMemo(() => getRoleDashboardConfig(roles, primaryRole), [roles, primaryRole])
  const breakpoint = useBreakpoint()
  const [isAcademicOpen, setIsAcademicOpen] = useState(false)

  // Mobile Dashboard View (Reference-Driven Edlink Structure)
  if (breakpoint.isMobile) {
    return (
      <div className="mobile-dashboard-container">
        {/* 1. Lightweight Context Section (Date & Academic Context Chip) */}
        <MobileGreetingContext
          date={currentDate}
          onOpenAcademic={() => setIsAcademicOpen(true)}
        />

        {/* 2. Menu Utama (Canonical Modules Filtered by Role) */}
        <MobileMenuGrid roles={roles} />

        {/* 3. Secondary Statistics (2 Columns, Clean, Role-Tailored) */}
        <MobileStatsGrid stats={roleConfig.mobileStats} />

        {/* Interactive Academic Context Switcher Sheet */}
        <MobileAcademicSheet
          isOpen={isAcademicOpen}
          onClose={() => setIsAcademicOpen(false)}
        />
      </div>
    )
  }

  // Desktop / Tablet Dashboard (Role-Tailored using Admin Design System)
  return (
    <>
      <DashboardHeader date={currentDate} userName={userName} subtitle={roleConfig.subtitle} />

      <section className="stats-grid" aria-label="Ringkasan dashboard">
        {(roleConfig?.desktopStats || stats).map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <TodaySchedule config={roleConfig} />
        <AttendanceOverview config={roleConfig} />
      </div>

      <div className="dashboard-grid bottom-grid">
        <RecentActivities />
        <SchoolAnnouncements />
      </div>
    </>
  )
}

export default Dashboard
