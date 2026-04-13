import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Ads.css';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api');

const AD_SLOTS = [
  // Home Page Section
  { id: 'home-hero', label: 'Home Page: After Welcome', desc: 'Prominent ad directly below the main welcome section.', category: 'Home Page' },
  { id: 'home-features', label: 'Home Page: Features Area', desc: 'Ad placed between main content sections.', category: 'Home Page' },
  { id: 'home-faq', label: 'Home Page: FAQ Section', desc: 'Ad inside the FAQ section.', category: 'Home Page' },
  { id: 'home-footer', label: 'Home Page: Footer Banner', desc: 'Banner ad at the bottom of the home page.', category: 'Home Page' },
  // Compress Page Section
  { id: 'compress-top', label: 'Compress Page: Above Upload', desc: 'Ad visible above the file drop zone.', category: 'Compress Page' },
  { id: 'compress-tool', label: 'Compress Page: After Upload', desc: 'Ad placed after the file is selected, before compression starts.', category: 'Compress Page' },
  { id: 'compress-sidebar', label: 'Compress Page: Sidebar Ad', desc: 'Ad placed in the right-hand sidebar.', category: 'Compress Page' },
  { id: 'compress-footer', label: 'Compress Page: Footer Banner', desc: 'Banner ad at the bottom of the tool page.', category: 'Compress Page' },
];

function Ads() {
  const [ads, setAds] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAds(response.data.ads);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const handleSave = async (position) => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/ads/save`, {
        position,
        code: ads[position]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Successfully saved: ${position}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (position, value) => {
    setAds({ ...ads, [position]: value });
  };

  const categories = ['Home Page', 'Compress Page'];

  return (
    <div className="ads-container">
      <div className="ads-header">
        <h1>Ad Manager</h1>
        <p>Manage exactly 4 ads per page (8 total). Paste your ad script or HTML code below.</p>
      </div>

      {message && <div className="success-msg">{message}</div>}

      {categories.map(category => (
        <div key={category} className="ad-category-section">
          <h2 className="category-title">{category}</h2>
          <div className="ads-grid">
            {AD_SLOTS.filter(s => s.category === category).map((slot) => (
              <div key={slot.id} className="ad-slot-card">
                <div className="slot-info">
                  <h3>{slot.label}</h3>
                  <p>{slot.desc}</p>
                </div>
                <textarea
                  placeholder="Paste ad code here (e.g. <script>...)"
                  value={ads[slot.id] || ''}
                  onChange={(e) => handleCodeChange(slot.id, e.target.value)}
                />
                <button
                  className="save-slot-btn"
                  onClick={() => handleSave(slot.id)}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Connection'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Ads;