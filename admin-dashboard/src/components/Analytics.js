import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api');

function Analytics() {
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const chartData = {
    labels: analytics.map(a => a.date),
    datasets: [
      {
        label: 'Total Compressions',
        data: analytics.map(a => a.totalCompressions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Ad Impressions',
        data: analytics.map(a => a.adImpressions),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
      {
        label: 'Ad Clicks',
        data: analytics.map(a => a.adClicks),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Website Analytics',
      },
    },
  };

  return (
    <div className="analytics">
      <h1>Analytics</h1>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      <div className="analytics-table">
        <h2>Daily Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Compressions</th>
              <th>Size Saved (MB)</th>
              <th>Ad Impressions</th>
              <th>Ad Clicks</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((a) => (
              <tr key={a.date}>
                <td>{a.date}</td>
                <td>{a.totalCompressions}</td>
                <td>{a.totalSizeSaved / (1024 * 1024).toFixed(2)}</td>
                <td>{a.adImpressions}</td>
                <td>{a.adClicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;