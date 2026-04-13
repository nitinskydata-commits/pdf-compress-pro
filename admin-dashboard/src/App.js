import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Ads from './components/Ads';
import Analytics from './components/Analytics';
import Compressions from './components/Compressions';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import './App.css';

function App() {
  const token = localStorage.getItem('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <Router>
      <div className="App">
        {token ? (
          <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Mobile Header */}
            <header className="mobile-admin-header">
              <button className="menu-toggle" onClick={toggleSidebar}>
                {sidebarOpen ? '✕' : '☰'}
              </button>
              <span className="mobile-brand">PDFCompress Pro</span>
            </header>

            <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
            
            {/* Backdrop for mobile */}
            {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}

            <div className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ads" element={<Ads />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/compressions" element={<Compressions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
