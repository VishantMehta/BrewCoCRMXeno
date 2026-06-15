import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Play, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function Campaigns() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  
  const [formData, setFormData] = useState({
    name: '',
    segment_id: '',
    message_template: '',
    channel: 'WhatsApp'
  });

  const [prefilledSegment, setPrefilledSegment] = useState(null);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [statsInterval, setStatsInterval] = useState(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (statsInterval) clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    if (location.state?.prefillSegment) {
      setPrefilledSegment(location.state.prefillSegment);
      setFormData(prev => ({ ...prev, name: `${location.state.prefillSegment.name} Campaign` }));
      setActiveTab('create');
      window.history.replaceState({}, document.title);
    }
    
    if (location.state?.prefillDraft) {
      setFormData(prev => ({ ...prev, message_template: location.state.prefillDraft }));
      setActiveTab('create');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [camps, segs] = await Promise.all([
        apiClient.getCampaigns(),
        apiClient.getSegments()
      ]);
      setCampaigns(camps);
      setSegments(segs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      let finalSegmentId = formData.segment_id;

      if (prefilledSegment && !finalSegmentId) {
        const newSeg = await apiClient.createSegment({
          name: prefilledSegment.name,
          rules_json: prefilledSegment.rules_json,
          created_by_ai: true
        });
        finalSegmentId = newSeg.id;
        setSegments(prev => [newSeg, ...prev]);
      }

      const newCamp = await apiClient.createCampaign({
        ...formData,
        segment_id: parseInt(finalSegmentId)
      });

      setCampaigns(prev => [newCamp, ...prev]);
      setActiveTab('list');
      setPrefilledSegment(null);
      setFormData({ name: '', segment_id: '', message_template: '', channel: 'WhatsApp' });
      fetchData();
    } catch (err) {
      alert('Failed to create campaign: ' + err.message);
    }
  };

  const handleLaunch = async (id) => {
    if (!confirm('Are you sure you want to launch this campaign?')) return;
    try {
      await apiClient.launchCampaign(id);
      fetchData();
      viewStats(id);
    } catch (err) {
      alert('Failed to launch: ' + err.message);
    }
  };

  const viewStats = async (id) => {
    setActiveTab('stats');
    refreshStats(id);
    if (statsInterval) clearInterval(statsInterval);
    const interval = setInterval(() => {
      refreshStats(id);
    }, 3000);
    setStatsInterval(interval);
  };

  const handleBackToList = () => {
    if (statsInterval) clearInterval(statsInterval);
    setStatsInterval(null);
    setActiveTab('list');
  };

  const refreshStats = async (id) => {
    try {
      const data = await apiClient.getCampaignStats(id);
      setSelectedCampaign(data.campaign);
      
      const rawStats = data.stats || [];
      const statsMap = { pending: 0, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 };
      rawStats.forEach(s => { statsMap[s.status] = s._count.status; });
      
      setCampaignStats(statsMap);
    } catch (err) {
      console.error(err);
    }
  };

  const renderStats = () => {
    if (!selectedCampaign || !campaignStats) return <div>Loading stats...</div>;

    const COLORS = {
      delivered: '#4CAF50',
      failed: '#F44336',
      opened: '#2196F3',
      clicked: '#FF9800',
      pending: '#9E9E9E',
      sent: '#FFC107'
    };

    const pieData = Object.keys(campaignStats)
      .filter(k => campaignStats[k] > 0)
      .map(key => ({ name: key, value: campaignStats[key], color: COLORS[key] }));

    return (
      <div className="glass card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2>{selectedCampaign.name}</h2>
            <p>Channel: {selectedCampaign.channel} | Status: {selectedCampaign.status}</p>
          </div>
          <button className="btn-secondary" onClick={() => refreshStats(selectedCampaign.id)}>
            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Refresh Stats
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3>Delivery Funnel</h3>
            <div style={{ height: '300px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[campaignStats]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#A0A0A0" />
                  <YAxis stroke="#A0A0A0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: 'none' }} />
                  <Bar dataKey="sent" fill={COLORS.sent} name="Sent" />
                  <Bar dataKey="delivered" fill={COLORS.delivered} name="Delivered" />
                  <Bar dataKey="opened" fill={COLORS.opened} name="Opened" />
                  <Bar dataKey="clicked" fill={COLORS.clicked} name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3>Status Distribution</h3>
            <div style={{ height: '300px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <button className="btn-secondary" style={{ marginTop: '2rem' }} onClick={handleBackToList}>
          Back to Campaigns
        </button>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Campaigns</h1>
        {activeTab !== 'create' && (
          <button className="btn-primary" onClick={() => setActiveTab('create')}>
            <Plus size={18} /> New Campaign
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Segment</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns found.</td></tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.segment?.name || 'Unknown'}</td>
                    <td>{c.channel}</td>
                    <td>
                      <span className="tag" style={{ 
                        backgroundColor: c.status === 'draft' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.2)',
                        color: c.status === 'draft' ? 'var(--text-secondary)' : 'var(--success)'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {c.status === 'draft' ? (
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleLaunch(c.id)}>
                            <Play size={14} /> Launch
                          </button>
                        ) : (
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => viewStats(c.id)}>
                            <BarChart2 size={14} /> Stats
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card glass" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Create Campaign</h2>
          {prefilledSegment && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(240, 165, 0, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <strong>AI Prefill:</strong> Using generated segment "{prefilledSegment.name}".
            </div>
          )}
          
          <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Campaign Name</label>
              <input 
                type="text" 
                className="chat-input" 
                style={{ width: '100%' }}
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Target Segment</label>
              {prefilledSegment ? (
                <input type="text" className="chat-input" style={{ width: '100%', opacity: 0.7 }} disabled value={`${prefilledSegment.name} (Auto-created on save)`} />
              ) : (
                <select 
                  className="chat-input" 
                  style={{ width: '100%' }}
                  required
                  value={formData.segment_id}
                  onChange={e => setFormData({...formData, segment_id: e.target.value})}
                >
                  {segments.length === 0 ? (
                    <option value="" disabled>No segments found! Use the AI Chat to create one first.</option>
                  ) : (
                    <option value="">Select a segment...</option>
                  )}
                  {segments.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Channel</label>
              <select 
                className="chat-input" 
                style={{ width: '100%' }}
                value={formData.channel}
                onChange={e => setFormData({...formData, channel: e.target.value})}
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message Template</label>
              <textarea 
                className="chat-input" 
                style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                required
                placeholder="Hi {{name}}, we miss you!"
                value={formData.message_template}
                onChange={e => setFormData({...formData, message_template: e.target.value})}
              ></textarea>
              <small style={{ color: 'var(--text-muted)' }}>Use {'{{name}}'} to insert the customer's name.</small>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Campaign</button>
              <button type="button" className="btn-secondary" onClick={() => { setActiveTab('list'); setPrefilledSegment(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'stats' && renderStats()}
    </div>
  );
}

export default Campaigns;
