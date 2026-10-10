import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="navbar">
        <h1 className="brand">Freelancer Tracker</h1>
        <div className="nav-right">
          <span className="nav-user">Hi, {user.name}</span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="tabs">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/clients">Clients</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/payments">Payments</NavLink>
      </nav>

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}