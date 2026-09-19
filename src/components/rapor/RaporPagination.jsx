import Icon from '../common/Icon.jsx'
import Pagination from '../common/Pagination.jsx'

function RaporPagination({ currentPage, rowsPerPage, totalItems, totalPages, onPageChange, onRowsPerPageChange }) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const lastItem = Math.min(currentPage * rowsPerPage, totalItems)

  return (
    <Pagination className="report-pagination">
      <p>Menampilkan {firstItem} - {lastItem} dari {totalItems} siswa</p>
      <div className="report-pagination-controls">
        <label>
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))}>
            <option value={8}>8</option><option value={12}>12</option><option value={18}>18</option>
          </select>
        </label>
        <button aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} type="button"><Icon name="chevron" /></button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button aria-current={currentPage === page ? 'page' : undefined} className={currentPage === page ? 'active' : ''} key={page} onClick={() => onPageChange(page)} type="button">{page}</button>
        ))}
        <button aria-label="Halaman berikutnya" className="next" disabled={currentPage === totalPages || totalPages === 0} onClick={() => onPageChange(currentPage + 1)} type="button"><Icon name="chevron" /></button>
      </div>
    </Pagination>
  )
}

export default RaporPagination
