import { useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import { raporDocumentTypes, raporStudents, schoolIdentity } from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'

export function CoverRaporView({ onNotify }) {
  const [studentId, setStudentId] = useState(String(raporStudents[0].id))
  const student = raporStudents.find((item) => String(item.id) === studentId) ?? raporStudents[0]

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters includeStudent values={{ studentId }} onChange={(key, value) => { if (key === 'studentId') setStudentId(value) }} />
      <div className="report-cover-layout">
        <aside className="report-cover-info">
          <span><Icon name="report" /></span><h3>Preview Cover Rapor</h3><p>Informasi sampul diambil dari Identitas Sekolah dan Master Data Siswa.</p>
          <dl><div><dt>Nama Siswa</dt><dd>{student.name}</dd></div><div><dt>NISN</dt><dd>{student.nisn}</dd></div><div><dt>Kelas</dt><dd>{student.className}</dd></div><div><dt>Tahun Ajaran</dt><dd>{student.academicYear}</dd></div></dl>
          <Button className="report-button secondary" onClick={() => onNotify('Preview cover siap dicetak.')}><Icon name="eye" />Preview Cetak</Button>
          <Button className="report-button primary" onClick={() => onNotify('Export cover PDF akan tersedia pada tahap integrasi berikutnya.')}><Icon name="download" />Export Cover PDF</Button>
        </aside>

        <article className="report-cover-paper">
          <div className="report-cover-crest">
            <img src={sman27Logo} alt="Logo SMAN 27 Garut" />
          </div>
          <p className="report-cover-title">RAPOR PESERTA DIDIK</p>
          <p className="report-cover-subtitle">SEKOLAH MENENGAH ATAS (SMA)</p>
          <h3>{schoolIdentity.name}</h3>
          <div className="report-cover-student"><span>Nama Peserta Didik</span><strong>{student.name}</strong><span>NISN</span><strong>{student.nisn}</strong></div>
          <div className="report-cover-year"><span>Tahun Ajaran</span><strong>{student.academicYear}</strong></div>
          <footer><strong>{schoolIdentity.ministry}</strong><span>{schoolIdentity.address}</span></footer>
        </article>
      </div>
    </section>
  )
}

export function ExportRaporView({ onNotify }) {
  const [documentType, setDocumentType] = useState(raporDocumentTypes[0])
  const [selectedIds, setSelectedIds] = useState(() => new Set(raporStudents.slice(0, 2).map((student) => student.id)))
  const allSelected = selectedIds.size === raporStudents.length

  const toggleStudent = (studentId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(raporStudents.map((student) => student.id)))
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters includeDocument values={{ documentType }} onChange={(key, value) => { if (key === 'documentType') setDocumentType(value) }} />
      <div className="report-export-layout">
        <section className="report-panel">
          <div className="report-section-heading"><div><span><Icon name="users" /></span><div><h3>Pilih Siswa</h3><p>Tentukan siswa yang akan dimasukkan ke dalam dokumen.</p></div></div><small>{selectedIds.size} siswa dipilih</small></div>
          <label className="report-select-all"><input checked={allSelected} onChange={toggleAll} type="checkbox" /><span><strong>Pilih Semua Siswa</strong><small>36 siswa kelas X Merdeka 3</small></span></label>
          <div className="report-student-checklist">
            {raporStudents.map((student) => <label key={student.id}><input checked={selectedIds.has(student.id)} onChange={() => toggleStudent(student.id)} type="checkbox" /><span>{student.name}<small>{student.nis}</small></span></label>)}
          </div>
        </section>

        <aside className="report-export-card">
          <span className="report-export-icon"><Icon name="document" /></span><h3>Persiapan Dokumen</h3><p>Periksa pilihan sebelum melakukan preview, cetak, atau export.</p>
          <dl><div><dt>Jenis Dokumen</dt><dd>{documentType}</dd></div><div><dt>Kelas</dt><dd>X Merdeka 3</dd></div><div><dt>Siswa Dipilih</dt><dd>{selectedIds.size} siswa</dd></div><div><dt>Semester</dt><dd>Genap 2024/2025</dd></div></dl>
          {selectedIds.size === 0 && <p className="report-generate-warning"><Icon name="info" />Pilih minimal satu siswa untuk melanjutkan.</p>}
          <div className="report-export-actions">
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={() => onNotify(`Preview ${documentType} siap ditampilkan.`)}><Icon name="eye" />Preview</Button>
            <Button className="report-button secondary" disabled={selectedIds.size === 0} onClick={() => onNotify('Dokumen siap dikirim ke dialog cetak browser pada tahap integrasi.')}><Icon name="printer" />Cetak</Button>
            <Button className="report-button primary" disabled={selectedIds.size === 0} onClick={() => onNotify('Fitur export PDF akan diintegrasikan pada tahap berikutnya.')}><Icon name="download" />Export PDF</Button>
          </div>
          <small>Belum ada file PDF yang dibuat pada tahap frontend ini.</small>
        </aside>
      </div>
    </section>
  )
}
