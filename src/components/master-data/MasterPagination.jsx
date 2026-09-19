import Icon from '../common/Icon.jsx'
import Pagination from '../common/Pagination.jsx'

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages]
}

function MasterPagination({
  currentPage,
  rowsPerPage,
  totalItems,
  totalPages,
  itemLabel = 'data',
  onPageChange,
  onRowsPerPageChange,
}) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const lastItem = Math.min(currentPage * rowsPerPage, totalItems)
  const pageItems = getPageItems(currentPage, totalPages)

  return (
    <Pagination className="master-pagination">
      <p>Menampilkan {firstItem} - {lastItem} dari {totalItems.toLocaleString('id-ID')} {itemLabel}</p>

      <div className="master-pagination-controls">
        <label>
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))}>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
          </select>
        </label>

        <button
          aria-label="Halaman sebelumnya"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <Icon name="chevron" />
        </button>

        {pageItems.map((item) => (
          typeof item === 'number' ? (
            <button
              aria-current={currentPage === item ? 'page' : undefined}
              className={currentPage === item ? 'active' : ''}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span aria-hidden="true" className="master-pagination-ellipsis" key={item}>...</span>
          )
        ))}

        <button
          aria-label="Halaman berikutnya"
          className="next"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <Icon name="chevron" />
        </button>
      </div>
    </Pagination>
  )
}

export default MasterPagination
