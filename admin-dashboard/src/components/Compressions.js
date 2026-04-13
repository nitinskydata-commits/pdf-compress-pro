import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Compressions.css';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api');

function Compressions() {
  const [compressions, setCompressions] = useState([]);

  useEffect(() => {
    loadCompressions();
  }, []);

  const loadCompressions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCompressions(response.data.stats.recentCompressions);
      }
    } catch (error) {
      console.error('Error loading compressions:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="compressions">
      <div className="compressions-header">
        <h1>Detailed Compression Logs</h1>
        <button 
          className="clear-btn" 
          onClick={async () => {
            if (window.confirm('Are you sure you want to clear ALL compression history? This cannot be undone.')) {
              try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/admin/compressions`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                loadCompressions();
              } catch (err) {
                console.error('Error clearing compressions:', err);
              }
            }
          }}
        >
          🗑️ Clear All History
        </button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Original Size</th>
              <th>Result Size</th>
              <th>Reduction</th>
              <th>Level</th>
              <th>Method</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {compressions.map((c, index) => (
              <tr key={index}>
                <td className="truncate" title={c.fileName || c.originalName}>
                  {c.fileName || c.originalName}
                </td>
                <td>{formatBytes(c.originalSize)}</td>
                <td>{formatBytes(c.compressedSize)}</td>
                <td className="reduction-value">-{c.reductionPercent}%</td>
                <td><span className={`level-badge ${c.compressionLevel || c.level}`}>{c.compressionLevel || c.level}</span></td>
                <td className="method-tag">{c.method || (c.optimized ? 'GS' : 'Original')}</td>
                <td>{new Date(c.timestamp || c.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Compressions;