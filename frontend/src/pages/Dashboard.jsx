import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Users, Megaphone, Activity, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    campaigns: 0,
    messagesSent: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, campRes] = await Promise.all([
          apiClient.getCustomers(1),
          apiClient.getCampaigns()
        ]);
        
        setStats({
          customers: custRes.meta?.total || 0,
          campaigns: campRes.length || 0,
          messagesSent: campRes.reduce((acc, c) => acc + (c._count?.communicationLogs || 0), 0)
        });
        
        setRecentCampaigns(campRes.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <h1>Dashboard</h1>
      <p style={{ marginBottom: '2rem' }}>Welcome to BrewCo AI CRM. Talk to the assistant to get started.</p>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="card stat-card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(240, 165, 0, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
              <Users color="var(--accent-primary)" size={24} />
            </div>
            <h3>Total Customers</h3>
          </div>
          <div className="stat-value">{loading ? '...' : stats.customers.toLocaleString()}</div>
        </div>
        
        <div className="card stat-card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(33, 150, 243, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
              <Megaphone color="var(--info)" size={24} />
            </div>
            <h3>Campaigns</h3>
          </div>
          <div className="stat-value" style={{ color: 'var(--info)', textShadow: '0 0 20px rgba(33, 150, 243, 0.2)' }}>
            {loading ? '...' : stats.campaigns}
          </div>
        </div>
        
        <div className="card stat-card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(76, 175, 80, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
              <Activity color="var(--success)" size={24} />
            </div>
            <h3>Communications</h3>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)', textShadow: '0 0 20px rgba(76, 175, 80, 0.2)' }}>
            {loading ? '...' : stats.messagesSent.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Recent Campaigns</h2>
          <Link to="/campaigns" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
            View All <ArrowUpRight size={18} />
          </Link>
        </div>
        
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Audience Size</th>
                <th>Launched At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : recentCampaigns.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns yet. Ask the AI to create one!</td></tr>
              ) : (
                recentCampaigns.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <span className="tag" style={{ 
                        backgroundColor: c.status === 'draft' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.2)',
                        color: c.status === 'draft' ? 'var(--text-secondary)' : 'var(--success)'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{c.channel}</td>
                    <td>{c._count?.communicationLogs || 0}</td>
                    <td>{c.launched_at ? new Date(c.launched_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
