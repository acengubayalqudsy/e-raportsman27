import { useState } from 'react'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import MasterDataTabs from '../../components/master-data/MasterDataTabs.jsx'
import MasterRoomView from '../../components/master-data/MasterRoomView.jsx'
import Icon from '../../components/common/Icon.jsx'
import './MasterData.css'

function Ruangan() {
  const [notice, setNotice] = useState('')

  return (
    <section className="master-page">
      <header className="master-header">
        <div>
          <h2>Master Data Ruangan</h2>
          <p>Kelola data ruangan, laboratorium, dan fasilitas sekolah secara akurat</p>
        </div>
        <div className="master-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Master Data', 'Data Ruangan']} />
        </div>
      </header>

      <MasterDataTabs activeKey="ruangan" />

      <MasterRoomView onNotify={setNotice} />

      {notice && (
        <div className="master-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default Ruangan
