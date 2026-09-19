import { moduleRows } from '../data/navigation.js'

function PlaceholderPage({ title }) {
  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <p>Beranda / {title}</p>
          <h2>{title}</h2>
          <span>Kelola data {title.toLowerCase()} dalam tampilan yang konsisten dengan dashboard.</span>
        </div>
        <button className="primary-action" type="button">Tambah Data</button>
      </div>

      <div className="module-toolbar">
        <label className="search-field">
          <span>Cari data</span>
          <input type="search" placeholder={`Cari ${title.toLowerCase()}...`} />
        </label>
        <label className="select-field">
          <span>Status</span>
          <select defaultValue="semua">
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="review">Review</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>

      <section className="data-card">
        <div className="data-card-header">
          <div>
            <h3>Daftar {title}</h3>
            <p>Contoh struktur tabel untuk menjaga scroll, spacing, dan lebar konten tetap stabil.</p>
          </div>
          <span>8 data</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode/Kelas</th>
                <th>Nama Data</th>
                <th>Penanggung Jawab</th>
                <th>Status</th>
                <th>Terakhir Diperbarui</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {moduleRows.map((row) => (
                <tr key={`${title}-${row.kode}-${row.nama}`}>
                  <td>{row.kode}</td>
                  <td>{row.nama}</td>
                  <td>{row.penanggungJawab}</td>
                  <td>
                    <span className={`status-badge ${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td>{row.update}</td>
                  <td>
                    <button className="table-action" type="button">Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>Menampilkan 1-8 dari 8 data</span>
          <div>
            <button type="button">Sebelumnya</button>
            <button type="button">Berikutnya</button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default PlaceholderPage
