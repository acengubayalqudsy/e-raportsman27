import GenerateRaporView from './GenerateRaporView.jsx'
import StudentRaporPreview from './StudentRaporPreview.jsx'
import { CoverRaporView, ExportRaporView } from './RaporDocumentViews.jsx'
import { LegerDeskripsiView, LegerNilaiView, PeringkatKelasView } from './RaporDataViews.jsx'

function RaporSectionViews({ activeKey, onNotify }) {
  if (activeKey === 'generate-rapor') return <GenerateRaporView onNotify={onNotify} />
  if (activeKey === 'rapor-per-siswa') return <StudentRaporPreview onNotify={onNotify} />
  if (activeKey === 'leger-nilai') return <LegerNilaiView />
  if (activeKey === 'leger-deskripsi') return <LegerDeskripsiView />
  if (activeKey === 'peringkat-kelas') return <PeringkatKelasView />
  if (activeKey === 'cover-rapor') return <CoverRaporView onNotify={onNotify} />
  if (activeKey === 'cetak-export') return <ExportRaporView onNotify={onNotify} />
  return null
}

export default RaporSectionViews
