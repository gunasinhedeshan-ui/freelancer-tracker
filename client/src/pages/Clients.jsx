import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { getErrorMessage } from '../utils/getErrorMessage';

const PAGE_SIZE = 8;
const emptyForm = { name: '', email: '', phone: '', company: '' };

function ClientForm({ initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(
    isEdit
      ? {
          name: initial.name || '',
          email: initial.email || '',
          phone: initial.phone || '',
          company: initial.company || '',
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
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
      const payload = { ...form, name: form.name.trim() };
      if (isEdit) await api.put(`/clients/${initial._id}`, payload);
      else await api.post('/clients', payload);
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

      <label>Name *</label>
      <input name="name" value={form.name} onChange={handleChange} />
      {errors.name && <span className="field-error">{errors.name}</span>}

      <label>Company</label>
      <input name="company" value={form.company} onChange={handleChange} />

      <label>Email</label>
      <input type="email" name="email" value={form.email} onChange={handleChange} />
      {errors.email && <span className="field-error">{errors.email}</span>}

      <label>Phone</label>
      <input name="phone" value={form.phone} onChange={handleChange} />

      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-sm" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update client' : 'Add client'}
        </button>
      </div>
    </form>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | { client }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/clients', {
        params: { search: search || undefined },
      });
      setClients(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300); // type කරන අතරේ request ගොඩක් යවන්නේ නැහැ
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete client "${c.name}"?`)) return;
    try {
      await api.delete(`/clients/${c._id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaved = () => {
    setModal(null);
    load();
  };

  const visible = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="page-head">
        <h2>Clients</h2>
        <button className="btn btn-sm" onClick={() => setModal({ client: null })}>
          + Add client
        </button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search clients by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="muted">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="muted">No clients found. Add your first client.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.company || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td className="actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setModal({ client: c })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c)}
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
          total={clients.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {modal && (
        <Modal
          title={modal.client ? 'Edit client' : 'Add client'}
          onClose={() => setModal(null)}
        >
          <ClientForm
            initial={modal.client}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}