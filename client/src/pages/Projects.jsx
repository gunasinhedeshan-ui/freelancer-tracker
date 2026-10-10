import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { getErrorMessage } from '../utils/getErrorMessage';
import { money, fmtDate, toInputDate } from '../utils/format';
import { downloadCsv } from '../utils/exportCsv';
const PAGE_SIZE = 8;
const STATUSES = ['Pending', 'Active', 'Completed'];
const emptyForm = { name: '', client: '', status: 'Pending', fee: '', deadline: '' };

function ProjectForm({ initial, clients, onSaved, onCancel }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(
    isEdit
      ? {
          name: initial.name,
          client: initial.client?._id || '',
          status: initial.status,
          fee: initial.fee,
          deadline: toInputDate(initial.deadline),
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.client) e.client = 'Select a client';
    if (form.fee === '' || Number(form.fee) < 0 || Number.isNaN(Number(form.fee)))
      e.fee = 'Enter a valid fee (0 or more)';
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
        name: form.name.trim(),
        client: form.client,
        status: form.status,
        fee: Number(form.fee),
        deadline: form.deadline || null,
      };
      if (isEdit) await api.put(`/projects/${initial._id}`, payload);
      else await api.post('/projects', payload);
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

      <label>Project name *</label>
      <input name="name" value={form.name} onChange={handleChange} />
      {errors.name && <span className="field-error">{errors.name}</span>}

      <label>Client *</label>
      <select name="client" value={form.client} onChange={handleChange}>
        <option value="">Select a client</option>
        {clients.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
      {errors.client && <span className="field-error">{errors.client}</span>}

      <div className="form-row">
        <div>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Fee (LKR) *</label>
          <input
            type="number"
            min="0"
            name="fee"
            value={form.fee}
            onChange={handleChange}
          />
          {errors.fee && <span className="field-error">{errors.fee}</span>}
        </div>
      </div>

      <label>Deadline</label>
      <input type="date" name="deadline" value={form.deadline} onChange={handleChange} />

      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-sm" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update project' : 'Add project'}
        </button>
      </div>
    </form>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', client: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.client) params.client = filters.client;
      const { data } = await api.get('/projects', { params });
      setProjects(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
   
  }, [filters]);

  const setFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete project "${p.name}" and its payments?`)) return;
    try {
      await api.delete(`/projects/${p._id}`);
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
      `projects-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Name', value: (p) => p.name },
        { label: 'Client', value: (p) => p.client?.name },
        { label: 'Status', value: (p) => p.status },
        { label: 'Fee', value: (p) => money(p.fee) },
        { label: 'Deadline', value: (p) => fmtDate(p.deadline) },
      ],
      projects
    );
  };

  const visible = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
            <div className="page-head">
        <h2>Projects</h2>
        <div className="head-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={exportCsv}
            disabled={projects.length === 0}
          >
            Export CSV
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setModal({ project: null })}
            disabled={clients.length === 0}
            title={clients.length === 0 ? 'Add a client first' : ''}
          >
            + Add project
          </button>
        </div>
      </div>

      {clients.length === 0 && (
        <p className="muted">You need at least one client before adding a project.</p>
      )}

      <div className="toolbar">
        <input
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filters.client} onChange={(e) => setFilter('client', e.target.value)}>
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="muted">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="muted">No projects found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.client?.name || '-'}</td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{money(p.fee)}</td>
                    <td>{fmtDate(p.deadline)}</td>
                    <td className="actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setModal({ project: p })}
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
          total={projects.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {modal && (
        <Modal
          title={modal.project ? 'Edit project' : 'Add project'}
          onClose={() => setModal(null)}
        >
          <ProjectForm
            initial={modal.project}
            clients={clients}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}