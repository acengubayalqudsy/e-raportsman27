import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'

function SummaryCard({ item }) {
  return (
    <article className={`reporting-summary-card reporting-tone-${item.tone}`}>
      <span className="reporting-summary-icon"><Icon name={item.icon} /></span>
      <div>
        <p>{item.title}</p>
        <strong>{item.value}</strong>
        <small>{item.caption}</small>
      </div>
    </article>
  )
}

function ReportCard({ item, onPreview }) {
  return (
    <article className={`reporting-type-card reporting-tone-${item.tone}`}>
      <header>
        <span className="reporting-type-icon"><Icon name={item.icon} /></span>
        <div>
          <h3>{item.label}</h3>
          <p>{item.description}</p>
        </div>
      </header>
      <ul>
        {item.features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      <footer>
        <Link to={item.route}>Lihat Laporan <Icon name="arrowRight" /></Link>
        <button aria-label={`Preview ${item.label}`} onClick={() => onPreview(item)} type="button"><Icon name="file" /></button>
      </footer>
    </article>
  )
}

function RecentReports({ items }) {
  return (
    <section className="reporting-side-card reporting-recent-card">
      <header><h3>Laporan Terbaru</h3><button type="button">Lihat Semua</button></header>
      <div className="reporting-recent-list">
        {items.map((item) => (
          <article key={item.id}>
            <span className={`reporting-recent-icon reporting-tone-${item.tone}`}><Icon name={item.icon} /></span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.className}</small>
            </div>
            <aside>
              <b className={`reporting-status reporting-status-${item.status.toLowerCase()}`}>{item.status}</b>
              <small>{item.date}</small>
            </aside>
          </article>
        ))}
      </div>
    </section>
  )
}

function ReportLandingView({ cards, filterPanel, onPreview, recentReports, statistics, summary }) {
  return (
    <div className="reporting-landing">
      <section className="reporting-summary-grid">
        {summary.map((item) => <SummaryCard item={item} key={item.title} />)}
      </section>

      {filterPanel}

      <section className="reporting-main-grid">
        <div>
          <section className="reporting-catalogue" aria-label="Jenis laporan">
            <h3>Jenis Laporan</h3>
            <div className="reporting-card-grid">
              {cards.length > 0 ? (
                cards.map((item) => <ReportCard item={item} key={item.key} onPreview={onPreview} />)
              ) : (
                <div className="reporting-catalogue-empty">
                  <Icon name="search" />
                  <strong>Laporan tidak ditemukan</strong>
                  <span>Coba ubah jenis laporan atau kata pencarian.</span>
                </div>
              )}
            </div>
          </section>
          <aside className="reporting-data-notice">
            <Icon name="info" />
            <div><strong>Catatan</strong><p>Pastikan data pada Master Data, Akademik, Penilaian, Absensi, dan Kegiatan Siswa sudah lengkap untuk mendapatkan hasil laporan yang akurat.</p></div>
          </aside>
        </div>

        <aside className="reporting-aside">
          <section className="reporting-side-card reporting-info-card">
            <header><h3>Informasi Laporan</h3></header>
            <div><Icon name="info" /><p>Semua laporan menggunakan data mock. Fitur cetak dan export akan aktif setelah integrasi backend.</p></div>
          </section>
          <section className="reporting-side-card reporting-chart-card">
            <h3>Statistik Laporan (Tahun Ini)</h3>
            <div className="reporting-bars" aria-label="Grafik laporan per bulan">
              {statistics.map((height, index) => <span key={index} style={{ height: `${height * 1.35}px` }} title={`${height} laporan`} />)}
            </div>
            <div className="reporting-chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Jun</span><span>Jul</span><span>Agu</span><span>Sep</span><span>Okt</span><span>Nov</span><span>Des</span></div>
          </section>
          <RecentReports items={recentReports} />
        </aside>
      </section>
    </div>
  )
}

export default ReportLandingView

