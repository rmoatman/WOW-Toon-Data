import { useMemo, useState, useEffect } from 'react';

/**
 * Reusable searchable, sortable, paginated table.
 *
 * columns: [{ key, label, sortable?, render?(value,row), className? }]
 * searchKeys: array of row keys to match the search query against
 * initialSort: { key, dir: 'asc' | 'desc' }
 */
export default function DataTable({
  items,
  columns,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  initialSort,
  pageSize = 50,
  emptyText = 'Nothing to show.',
  onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);

  // Reset to the first page whenever the filter or sort changes.
  useEffect(() => {
    setPage(0);
  }, [query, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
    );
  }, [items, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const factor = dir === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageItems = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null; // third click clears sort
    });
  };

  const sortIndicator = (key) => {
    if (!sort || sort.key !== key) return '';
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  };

  const renderPager = (pos) =>
    pageCount > 1 ? (
      <div className={`datatable-pager ${pos}`}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={clampedPage === 0}
        >
          Prev
        </button>
        <span className="muted">
          Page {clampedPage + 1} of {pageCount}
        </span>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={clampedPage >= pageCount - 1}
        >
          Next
        </button>
      </div>
    ) : null;

  return (
    <div className="datatable">
      <div className="datatable-toolbar">
        <input
          type="search"
          className="datatable-search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="datatable-count muted">
          {sorted.length.toLocaleString()} {sorted.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="muted datatable-empty">{query ? 'No matches.' : emptyText}</p>
      ) : (
        <>
          {renderPager('top')}
          <div className="datatable-scroll">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={[col.className, col.sortable ? 'sortable' : '', col.hideMobile ? 'hide-mobile' : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                      aria-sort={
                        sort?.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                    >
                      {col.label}
                      {col.sortable ? sortIndicator(col.key) : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className={onRowClick ? 'clickable' : ''}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[col.className, col.hideMobile ? 'hide-mobile' : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderPager('bottom')}
        </>
      )}
    </div>
  );
}
