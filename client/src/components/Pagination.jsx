export default function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="btn btn-outline btn-sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      <span className="muted">
        Page {page} of {pages}
      </span>
      <button
        className="btn btn-outline btn-sm"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}