import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/axios';
import { getErrorMessage } from '../utils/getErrorMessage';
import { money } from '../utils/format';

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Active: '#3b82f6',
  Completed: '#16a34a',
};

// "2026-09" -> "Sep 26"
const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en', { month: 'short', year: '2-digit' });
};

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

  const monthly = data.monthlyIncome.slice(-12).map((m) => ({
    month: monthLabel(m.month),
    total: m.total,
  }));

  const statusData = data.projectStatus.map((s) => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <>
      <h2>Dashboard</h2>

      <div className="stats">
        <div className="card stat">
          <span className="muted">Active projects</span>
          <strong>{data.activeProjects}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Total projects</span>
          <strong>{data.totalProjects}</strong>
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

      <div className="charts">
        <div className="card">
          <h3>Monthly income</h3>
          <p className="muted">Paid payments, last 12 months</p>
          {monthly.length === 0 ? (
            <p className="muted chart-empty">
              No paid payments yet. Mark a payment as Paid to see your income here.
            </p>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                    width={50}
                  />
                  <Tooltip formatter={(v) => [money(v), 'Income']} />
                  <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Project status</h3>
          <p className="muted">Number of projects in each status</p>
          {statusData.length === 0 ? (
            <p className="muted chart-empty">No projects yet. Add a project to see this chart.</p>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    label={({ value }) => value}
                  >
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={STATUS_COLORS[s.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}