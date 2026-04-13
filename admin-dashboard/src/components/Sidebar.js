import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, closeSidebar }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <h3>PDFCompress Pro</h3>
      <nav>
        <NavLink to="/dashboard" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📈 Dashboard
        </NavLink>
        <NavLink to="/ads" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📢 Manage Ads
        </NavLink>
        <NavLink to="/compressions" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📄 Compressions
        </NavLink>
        <NavLink to="/analytics" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          📊 Analytics
        </NavLink>
        <NavLink to="/settings" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
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