import { useEffect, useRef } from 'react'
import Icon from '../common/Icon.jsx'

function ReportPreviewModal({ report, onClose, onNotify }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    dialogRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!report) return null

  const title = report.label ?? report.title

  return (
    <div className="reporting-modal-backdrop" onMouseDown={onClose} role="presentation">
      <section aria-labelledby="reporting-preview-title" aria-modal="true" className="reporting-preview-modal" onMouseDown={(event) => event.stopPropagation()} ref={dialogRef} role="dialog" tabIndex="-1">
        <header>
          <div><span><Icon name={report.icon ?? 'document'} /></span><div><p>Preview Laporan</p><h3 id="reporting-preview-title">{title}</h3></div></div>
          <button aria-label="Tutup preview" onClick={onClose} type="button">&times;</button>
        </header>
        <div className="reporting-preview-sheet">
          <div className="reporting-preview-school"><span>SMAN 27 GARUT</span><small>Aplikasi e-Rapor · Tahun Ajaran 2024/2025</small></div>
          <h2>{title.toUpperCase()}</h2>
          <p>Semester Genap · Tahun Ajaran 2024/2025</p>
          <div className="reporting-preview-lines"><span /><span /><span /><span /></div>
          <small>Preview ini menggunakan data mock untuk kebutuhan tampilan frontend.</small>
        </div>
        <footer>
          <button onClick={onClose} type="button">Tutup</button>
          <button onClick={() => onNotify('Cetak laporan disimulasikan pada frontend.')} type="button"><Icon name="printer" /> Cetak</button>
          <button className="primary" onClick={() => onNotify('Export PDF disimulasikan pada frontend.')} type="button"><Icon name="download" /> Export PDF</button>
        </footer>
      </section>
    </div>
  )
}

export default ReportPreviewModal

