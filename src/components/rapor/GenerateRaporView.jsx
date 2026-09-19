import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import { raporReadiness } from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'

function GenerateRaporView({ onNotify }) {
  const [resolvedItems, setResolvedItems] = useState(() => new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const readiness = useMemo(() => raporReadiness.map((item) => resolvedItems.has(item.id) ? { ...item, progress: '36/36', status: 'Lengkap', description: 'Data telah ditandai lengkap untuk simulasi.' } : item), [resolvedItems])
  const incomplete = readiness.filter((item) => item.status !== 'Lengkap')

  const generate = () => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setIsGenerating(false)
      onNotify('36 rapor berhasil dibuat dalam simulasi frontend.')
    }, 650)
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters />
      <div className="report-generate-layout">
        <section className="report-panel">
          <div className="report-section-heading">
            <div><span><Icon name="clipboardCheck" /></span><div><h3>Kesiapan Data Rapor</h3><p>Periksa kelengkapan data sebelum memulai proses generate.</p></div></div>
            <span className={`report-readiness-overall ${incomplete.length ? 'warning' : 'complete'}`}>{incomplete.length ? `${incomplete.length} perlu diperiksa` : 'Semua lengkap'}</span>
          </div>
          <div className="report-readiness-list">
            {readiness.map((item) => (
              <article className="report-readiness-item" key={item.id}>
                <span className={`report-readiness-icon ${item.status === 'Lengkap' ? 'complete' : 'warning'}`}><Icon name={item.status === 'Lengkap' ? 'check' : 'info'} /></span>
                <div><strong>{item.label}</strong><p>{item.description}</p></div>
                <span className="report-readiness-progress">{item.progress}</span>
                <span className={`report-readiness-status ${item.status === 'Lengkap' ? 'complete' : 'warning'}`}>{item.status}</span>
                {item.status !== 'Lengkap' && <button onClick={() => setResolvedItems((current) => new Set(current).add(item.id))} type="button">Tandai selesai</button>}
              </article>
            ))}
          </div>
        </section>

        <aside className="report-generate-card">
          <span className="report-generate-icon"><Icon name="settings" /></span>
          <h3>Generate Rapor Kelas</h3>
          <p>Rapor akan dibuat untuk seluruh siswa kelas X Merdeka 3 berdasarkan data yang telah tervalidasi.</p>
          <dl><div><dt>Jumlah Siswa</dt><dd>36 siswa</dd></div><div><dt>Tahun Ajaran</dt><dd>2024/2025</dd></div><div><dt>Semester</dt><dd>Genap</dd></div></dl>
          {incomplete.length > 0 && <p className="report-generate-warning"><Icon name="info" />Lengkapi {incomplete.length} data sebelum rapor dapat dibuat.</p>}
          <Button className="report-button primary" disabled={incomplete.length > 0 || isGenerating} onClick={generate}>{isGenerating ? <span className="report-spinner" /> : <Icon name="settings" />}{isGenerating ? 'Memproses Rapor...' : 'Generate Rapor'}</Button>
          <small>Proses pada tahap ini hanya mengubah simulasi local state.</small>
        </aside>
      </div>
    </section>
  )
}

export default GenerateRaporView
