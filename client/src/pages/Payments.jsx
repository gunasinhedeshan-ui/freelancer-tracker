import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { getErrorMessage } from '../utils/getErrorMessage';
import { money, fmtDate, toInputDate } from '../utils/format';
import { downloadCsv } from '../utils/exportCsv';
const PAGE_SIZE = 8;
const today = () => new Date().toISOString().slice(0, 10);

function PaymentForm({ initial, projects, onSaved, onCancel }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(
    isEdit
      ? {
          project: initial.project?._id || '',
          amount: initial.amount,
          date: toInputDate(initial.date),
          status: initial.status,
          note: initial.note || '',
        }
      : { project: '', amount: '', date: today(), status: 'Pending', note: '' }
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.project) e.project = 'Select a project';
    if (form.amount === '' || Number(form.amount) <= 0 || Number.isNaN(Number(form.amount)))
      e.amount = 'Enter an amount greater than 0';
    if (!form.date) e.date = 'Date is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      const payload = {
        project: form.project,
        amount: Number(form.amount),
        date: form.date,
        status: form.status,
        note: form.note.trim(),
      };
      if (isEdit) await api.put(`/payments/${initial._id}`, payload);
      else await api.post('/payments', payload);
      onSaved();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="alert">{serverError}</div>}

      <label>Project *</label>
      <select name="project" value={form.project} onChange={handleChange}>
        <option value="">Select a project</option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name} ({p.client?.name})
          </option>
        ))}
      </select>
      {errors.project && <span className="field-error">{errors.project}</span>}

      <div className="form-row">
        <div>
          <label>Amount (LKR) *</label>
          <input
            type="number"
            min="0"
            name="amount"
            value={form.amount}
            onChange={handleChange}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>
        <div>
          <label>Date *</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
      </div>

      <label>Status</label>
      <select name="status" value={form.status} onChange={handleChange}>
        <option>Pending</option>
        <option>Paid</option>
      </select>

      <label>Note</label>
      <input name="note" value={form.note} onChange={handleChange} />

      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-sm" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update payment' : 'Add payment'}
        </button>
      </div>
    </form>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ status: '', project: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.project) params.project = filters.project;
      const { data } = await api.get('/payments', { params });
      setPayments(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
   
  }, [filters]);

  const setFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleDelete = async (p) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await api.delete(`/payments/${p._id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const markPaid = async (p) => {
    try {
      await api.put(`/payments/${p._id}`, {
        project: p.project._id,
        amount: p.amount,
        date: toInputDate(p.date),
        status: 'Paid',
        note: p.note || '',
      });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaved = () => {
    setModal(null);
    load();
  };
    const exportCsv = () => {
    downloadCsv(
      `payments-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Date', value: (p) => toInputDate(p.date) },
        { label: 'Project', value: (p) => p.project?.name },
        { label: 'Client', value: (p) => p.project?.client?.name },
        { label: 'Amount (LKR)', value: (p) => p.amount },
        { label: 'Status', value: (p) => p.status },
        { label: 'Note', value: (p) => p.note },
      ],
      payments
    );
  };

  const sum = (status) =>
    payments.filter((p) => p.status === status).reduce((t, p) => t + p.amount, 0);

  const visible = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
            <div className="page-head">
        <h2>Payments</h2>
        <div className="head-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={exportCsv}
            disabled={payments.length === 0}
          >
            Export CSV
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setModal({ payment: null })}
            disabled={projects.length === 0}
            title={projects.length === 0 ? 'Add a project first' : ''}
          >
            + Add payment
          </button>
        </div>
      </div>

      {projects.length === 0 && (
        <p className="muted">You need at least one project before recording payments.</p>
      )}

      <div className="toolbar">
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
        <select value={filters.project} onChange={(e) => setFilter('project', e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="muted">Paid (filtered)</span>
          <strong>{money(sum('Paid'))}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Pending (filtered)</span>
          <strong>{money(sum('Pending'))}</strong>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="muted">No payments found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p._id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{p.project?.name || '-'}</td>
                    <td>{p.project?.client?.name || '-'}</td>
                    <td>{money(p.amount)}</td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.note || '-'}</td>
                    <td className="actions">
                      {p.status === 'Pending' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => markPaid(p)}
                        >
                          Mark paid
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setModal({ payment: p })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          total={payments.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {modal && (
        <Modal
          title={modal.payment ? 'Edit payment' : 'Add payment'}
          onClose={() => setModal(null)}
        >
          <PaymentForm
            initial={modal.payment}
            projects={projects}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}