import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/getErrorMessage';

const money = (n) => `LKR ${Number(n).toLocaleString()}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p className="muted">Loading...</p>;

  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="card stat">
          <span className="muted">Active projects</span>
          <strong>{data.activeProjects}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Total income</span>
          <strong>{money(data.totalIncome)}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Pending payments</span>
          <strong>{money(data.pendingPayments)}</strong>
        </div>
      </div>
    </>
  );
}