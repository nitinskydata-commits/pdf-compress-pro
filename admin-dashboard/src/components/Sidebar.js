import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <h3>PDFCompress Pro</h3>
      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📈 Dashboard
        </NavLink>
        <NavLink to="/ads" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📢 Manage Ads
        </NavLink>
        <NavLink to="/compressions" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📄 Compressions
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📊 Analytics
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          ⚙️ Settings
        </NavLink>
        <button onClick={handleLogout} className="nav-item logout-btn">
          🚪 Logout
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;