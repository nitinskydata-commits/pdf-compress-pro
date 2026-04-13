import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api');

function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentCompressions, setRecentCompressions] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
        setRecentCompressions(response.data.stats.recentCompressions);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Overview</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Compressions</h3>
          <div className="value">{stats.totalCompressions?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Size Saved</h3>
          <div className="value">{formatBytes(stats.totalSizeSaved)}</div>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <div className="value">{stats.monthlyTotal || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Reduction</h3>
          <div className="value">{stats.monthlyAvgReduction || 0}%</div>
        </div>
      </div>
      <div className="recent-section">
        <h2>Recent Activity</h2>
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Reduction</th>
              <th>Level</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {recentCompressions.map((c, index) => (
              <tr key={index}>
                <td title={c.fileName || c.originalName}>
                  {(c.fileName || c.originalName || 'unknown').substring(0, 40)}
                  {(c.fileName || c.originalName || '').length > 40 ? '...' : ''}
                </td>
                <td className="reduction-value">-{c.reductionPercent}%</td>
                <td><span className={`level-badge ${c.compressionLevel}`}>{c.compressionLevel}</span></td>
                <td>{new Date(c.timestamp || c.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;