import { useMemo, useState } from 'react'
import Icon from '../../components/common/Icon.jsx'
import { teacherSummaryCards, teachersMock } from '../../data/teachers.js'

function TeacherSummaryCard({ card }) {
  return (
    <article className="teacher-summary-card">
      <span className="teacher-summary-icon">
        <Icon name={card.icon} />
      </span>
      <span className="teacher-summary-copy">
        <strong>{card.title}</strong>
        <b>{card.value}</b>
        <small>{card.caption}</small>
      </span>
    </article>
  )
}

function DataGuru() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: 'Semua',
    gender: 'Semua',
    subject: 'Semua',
  })

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return teachersMock.filter((teacher) => {
      const matchesSearch =
        !query ||
        [teacher.name, teacher.nip, teacher.subject].some((value) => value.toLowerCase().includes(query))
      const matchesStatus = filters.status === 'Semua' || teacher.status === filters.status
      const matchesGender = filters.gender === 'Semua' || teacher.gender === filters.gender
      const matchesSubject = filters.subject === 'Semua' || teacher.subject === filters.subject

      return matchesSearch && matchesStatus && matchesGender && matchesSubject
    })
  }, [filters, search])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="teacher-page">
      <header className="teacher-page-header">
        <h2>Data Guru</h2>
        <nav aria-label="Breadcrumb">
          <span>Home</span>
          <Icon name="chevron" />
          <span>Master Data</span>
          <Icon name="chevron" />
          <strong>Data Guru</strong>
        </nav>
      </header>

      <section className="teacher-summary-grid" aria-label="Ringkasan data guru">
        {teacherSummaryCards.map((card) => (
          <TeacherSummaryCard card={card} key={card.title} />
        ))}
      </section>

      <section className="teacher-card">
        <div className="teacher-toolbar">
          <label className="teacher-search">
            <Icon name="search" />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari guru (nama, NIP, mata pelajaran)..."
              type="search"
              value={search}
            />
          </label>

          <label className="teacher-filter-select">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option>Semua</option>
              <option>Aktif</option>
              <option>Tidak Aktif</option>
            </select>
          </label>

          <label className="teacher-filter-select">
            <span>Jenis Kelamin</span>
            <select value={filters.gender} onChange={(event) => updateFilter('gender', event.target.value)}>
              <option>Semua</option>
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </label>

          <label className="teacher-filter-select subject">
            <span>Mata Pelajaran</span>
            <select value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)}>
              <option>Semua</option>
              {[...new Set(teachersMock.map((teacher) => teacher.subject))].map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
          </label>

          <button className="teacher-filter-button" type="button">
            <Icon name="filter" />
            Filter
          </button>

          <button className="add-teacher-button" type="button">
            <Icon name="plus" />
            Tambah Guru
          </button>

          <button className="teacher-more-button" type="button" aria-label="Aksi lainnya">
            <Icon name="more" />
          </button>
        </div>

        <div className="teacher-table-wrap">
          <table className="teacher-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Foto</th>
                <th>Nama Guru</th>
                <th>NIP</th>
                <th>Mata Pelajaran</th>
                <th>Jenis Kelamin</th>
                <th>Status</th>
                <th>No. Telepon</th>
                <th>Email</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher, index) => (
                <tr key={teacher.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className={`teacher-photo ${teacher.gender === 'Perempuan' ? 'female' : 'male'}`}>
                      {teacher.avatar}
                    </span>
                  </td>
                  <td>
                    <div className="teacher-identity">
                      <strong>{teacher.name}</strong>
                      <span>Guru</span>
                    </div>
                  </td>
                  <td>{teacher.nip}</td>
                  <td>
                    <span className={`subject-badge ${teacher.subject.toLowerCase().replaceAll(' ', '-')}`}>
                      {teacher.subject}
                    </span>
                  </td>
                  <td>
                    <span className={`teacher-gender ${teacher.gender === 'Perempuan' ? 'female' : 'male'}`}>
                      <Icon name="user" />
                      {teacher.gender}
                    </span>
                  </td>
                  <td>
                    <span className="teacher-status-badge">{teacher.status}</span>
                  </td>
                  <td>{teacher.phone}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action view" type="button" aria-label={`Lihat ${teacher.name}`}>
                        <Icon name="eye" />
                      </button>
                      <button className="row-action edit" type="button" aria-label={`Edit ${teacher.name}`}>
                        <Icon name="edit" />
                      </button>
                      <button className="row-action delete" type="button" aria-label={`Hapus ${teacher.name}`}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="teacher-pagination">
          <p>Menampilkan 1 - {filteredTeachers.length} dari 87 data</p>
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
            <button className="page-number" type="button">9</button>
            <button className="page-nav next" type="button" aria-label="Halaman berikutnya">
              <Icon name="chevron" />
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default DataGuru
