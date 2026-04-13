import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

function Settings() {
  const [logo, setLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLogo(response.data.settings.logo);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setMessage('');
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/logo`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      if (response.data.success) {
        setLogo(response.data.logoUrl);
        setLogoPreview(null);
        setLogoFile(null);
        setMessage('Logo saved successfully!');
      }
    } catch (err) {
      setError('Failed to save logo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/settings`, { adminPassword: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage('Password updated successfully!');
        setNewPassword('');
      }
    } catch (err) {
      setError('Failed to update password');
    }
  };

  return (
    <div className="settings-container">
      <h1>Site Settings</h1>
      
      {message && <div className="success-msg">{message}</div>}
      {error && <div className="error-msg">{error}</div>}

      <div className="settings-section">
        <h3>Website Logo</h3>
        <div className="logo-flex">
          <div className="logo-preview-box">
            <p>Current Logo</p>
            <div className="logo-circle">
              {logo ? <img src={logo.startsWith('/') ? `${API_URL.replace('/api', '')}${logo}` : logo} alt="Current Logo" /> : <div className="no-logo">No logo</div>}
            </div>
          </div>
          
          {logoPreview && (
            <div className="logo-preview-box">
              <p>New Preview</p>
              <div className="logo-circle preview">
                <img src={logoPreview} alt="New Logo Preview" />
              </div>
            </div>
          )}
        </div>

        <div className="upload-actions">
          <input type="file" id="logoInput" accept="image/*" onChange={handleFileChange} style={{display:'none'}} />
          <button className="secondary-btn" onClick={() => document.getElementById('logoInput').click()}>
            Choose Image
          </button>
          <button 
            className="primary-btn" 
            onClick={handleLogoUpload} 
            disabled={loading || !logoFile}
            style={{ opacity: (!logoFile || loading) ? 0.6 : 1, cursor: (!logoFile || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Logo'}
          </button>
        </div>
        <p className="hint">Upload a circular or square image. Click "Save Logo" to apply changes.</p>
      </div>

      <div className="settings-section">
        <h3>Change Admin Password</h3>
        <form onSubmit={handleUpdatePassword}>
          <input 
            type="password" 
            placeholder="New admin password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit">Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
