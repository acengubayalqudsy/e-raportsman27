import { useMemo } from 'react'
import Icon from '../../components/common/Icon.jsx'
import { activities, announcements, attendanceData, scheduleRows, stats } from '../../data/dashboard.js'
import { user } from '../../data/navigation.js'

function formatDate(date) {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function DashboardHeader({ date }) {
  return (
    <section className="dashboard-header">
      <div>
        <h2>Selamat datang, {user.greetingName} <span aria-hidden="true">{'\u{1F44B}'}</span></h2>
        <p>Kelola data akademik dengan mudah dan terintegrasi</p>
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
        {actionText && (
          <a className="panel-action" href={href}>
            {actionText}
          </a>
        )}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function TodaySchedule() {
  return (
    <Panel title="Jadwal Hari Ini" icon="calendar" actionText="Lihat Semua" href="/akademik/jadwal">
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

function AttendanceOverview() {
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
    <Panel title="Absensi Siswa Hari Ini" icon="grade" actionText="Lihat Detail" href="/absensi">
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

function Dashboard() {
  const currentDate = useMemo(() => formatDate(new Date()), [])

  return (
    <>
      <DashboardHeader date={currentDate} />

      <section className="stats-grid" aria-label="Ringkasan dashboard">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </section>

      <div className="dashboard-grid">
        <TodaySchedule />
        <AttendanceOverview />
      </div>

      <div className="dashboard-grid bottom-grid">
        <RecentActivities />
        <SchoolAnnouncements />
      </div>
    </>
  )
}

export default Dashboard
