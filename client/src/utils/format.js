export const money = (n) => `LKR ${Number(n || 0).toLocaleString()}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');