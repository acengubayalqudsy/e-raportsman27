import { useMemo, useState } from 'react'
import Icon from '../../components/common/Icon.jsx'
import { masterSummaryCards, studentsMock } from '../../data/students.js'

function MasterSummaryCard({ card }) {
  return (
    <button className={`master-summary-card ${card.tone}`} type="button">
      <span className="master-summary-icon">
        <Icon name={card.icon} />
      </span>
      <span className="master-summary-copy">
        <strong>{card.title}</strong>
        <b>{card.value}</b>
        <small>{card.caption}</small>
      </span>
      <span className="master-summary-arrow">
        <Icon name="arrowRight" />
      </span>
    </button>
  )
}

function DataSiswa() {
  const [search, setSearch] = useState('')
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return studentsMock
    }

    return studentsMock.filter((student) => {
      return [student.nis, student.nisn, student.name].some((value) => value.toLowerCase().includes(query))
    })
  }, [search])

  return (
    <section className="student-page">
      <header className="student-page-header">
        <h2>Master Data</h2>
        <nav aria-label="Breadcrumb">
          <span>Home</span>
          <Icon name="chevron" />
          <strong>Master Data</strong>
        </nav>
      </header>

      <section className="master-summary-grid" aria-label="Ringkasan master data">
        {masterSummaryCards.map((card) => (
          <MasterSummaryCard card={card} key={card.title} />
        ))}
      </section>

      <section className="student-card">
        <div className="student-card-toolbar">
          <div className="student-card-title">
            <span>
              <Icon name="users" />
            </span>
            <h3>Data Siswa</h3>
          </div>

          <div className="student-actions">
            <label className="student-search">
              <Icon name="search" />
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari siswa (NIS/NISN/Nama)..."
                type="search"
                value={search}
              />
            </label>
            <button className="secondary-button" type="button">
              <Icon name="filter" />
              Filter
            </button>
            <button className="add-student-button" type="button">
              <Icon name="plus" />
              Tambah Siswa
            </button>
            <button className="more-button" type="button" aria-label="Aksi lainnya">
              <Icon name="more" />
            </button>
          </div>
        </div>

        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Jenis Kelamin</th>
                <th>Tempat, Tanggal Lahir</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.nis}</td>
                  <td>{student.nisn}</td>
                  <td>{student.name}</td>
                  <td>{student.className}</td>
                  <td>
                    <span className={`gender-badge ${student.gender === 'Perempuan' ? 'female' : 'male'}`}>
                      {student.gender}
                    </span>
                  </td>
                  <td>{student.birth}</td>
                  <td>
                    <span className="student-status-badge">{student.status}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action view" type="button" aria-label={`Lihat ${student.name}`}>
                        <Icon name="eye" />
                      </button>
                      <button className="row-action edit" type="button" aria-label={`Edit ${student.name}`}>
                        <Icon name="edit" />
                      </button>
                      <button className="row-action delete" type="button" aria-label={`Hapus ${student.name}`}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="student-pagination">
          <p>Menampilkan 1 - {filteredStudents.length} dari 1.248 data</p>
          <div className="pagination-controls">
            <button className="page-size" type="button">
              10 / halaman
              <Icon name="chevron" />
            </button>
            <button className="page-nav" type="button" aria-label="Halaman sebelumnya">
              <Icon name="chevron" />
            </button>
            {[1, 2, 3, 4, 5].map((page) => (
              <button className={`page-number ${page === 1 ? 'active' : ''}`} key={page} type="button">
                {page}
              </button>
            ))}
            <span>...</span>
            <button className="page-number" type="button">125</button>
            <button className="page-nav next" type="button" aria-label="Halaman berikutnya">
              <Icon name="chevron" />
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default DataSiswa
