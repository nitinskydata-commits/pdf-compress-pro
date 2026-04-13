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

  return (
    <div className="compressions">
      <div className="compressions-header">
        <h1>All Compressions</h1>
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
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Original Size (MB)</th>
            <th>Compressed Size (MB)</th>
            <th>Reduction (%)</th>
            <th>Level</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {compressions.map((c, index) => (
            <tr key={index}>
              <td>{c.fileName}</td>
              <td>{(c.originalSize / (1024 * 1024)).toFixed(2)}</td>
              <td>{(c.compressedSize / (1024 * 1024)).toFixed(2)}</td>
              <td>{c.reductionPercent}%</td>
              <td>{c.compressionLevel}</td>
              <td>{new Date(c.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Compressions;