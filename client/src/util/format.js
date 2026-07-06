const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format as "Jul 06, 2026" — 3-letter month, zero-padded day, 4-digit year.
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${day}, ${d.getFullYear()}`;
}
