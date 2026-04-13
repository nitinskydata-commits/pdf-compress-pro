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

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Compressions</h3>
          <div className="value">{stats.totalCompressions?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Size Saved</h3>
          <div className="value">{stats.totalSizeSavedMB || 0} MB</div>
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
        <h2>Recent Compressions</h2>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Reduction</th>
              <th>Level</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentCompressions.map((c, index) => (
              <tr key={index}>
                <td>{c.fileName.substring(0, 30)}</td>
                <td>{c.reductionPercent}%</td>
                <td>{c.compressionLevel}</td>
                <td>{new Date(c.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;